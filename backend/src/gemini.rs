use axum::{
    extract::State,
    response::IntoResponse,
    Json,
};
use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use redis::AsyncCommands; // Import the trait for async Redis commands
use crate::AppState;

#[derive(Deserialize)]
pub struct GeminiRequest {
    pub bibtex: String,
}

#[derive(Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Serialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Serialize)]
struct GeminiGenerateRequest {
    contents: Vec<GeminiContent>,
}

// Minimal structure for parsing Gemini response chunks
#[derive(Deserialize, Debug)]
struct GeminiResponseChunk {
    candidates: Option<Vec<GeminiCandidate>>,
    // Error fields might be present
    #[allow(dead_code)]
    error: Option<GeminiError>,
}

#[derive(Deserialize, Debug)]
struct GeminiCandidate {
    content: Option<GeminiContentStruct>,
}

#[derive(Deserialize, Debug)]
struct GeminiContentStruct {
    parts: Option<Vec<GeminiPartStruct>>,
}

#[derive(Deserialize, Debug)]
struct GeminiPartStruct {
    text: Option<String>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct GeminiError {
    code: i32,
    message: String,
}

pub async fn gemini_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<GeminiRequest>,
) -> impl IntoResponse {
    let api_key = std::env::var("GEMINI_API_KEY").expect("GEMINI_API_KEY not set");
    
    // Cache Key
    let hash = md5::compute(&payload.bibtex);
    let cache_key = format!("gemini:explanation:{:x}", hash);

    // 1. Check Redis Cache
    let mut con = match state.redis.get_multiplexed_async_connection().await {
        Ok(c) => c,
        Err(e) => return (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR, 
            Json(json!({"error": format!("Redis connection failed: {}", e)}))
        ).into_response()
    };

    if let Ok(cached) = con.get::<_, String>(&cache_key).await {
        // Return cached plain text
        return (
            [("Content-Type", "text/plain; charset=utf-8"), ("X-Cache", "HIT")],
            cached
        ).into_response();
    }

    // 2. Models Loop
    let models = [
        "gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemma-3-27b-it"
    ];

    let client = Client::new();
    
    let prompt_text = format!(
        "Please provide a concise explanation of this paper in English.\n\n\
        Structure your response with clear Markdown formatting:\n\n\
        ## Summary\n\
        A one-sentence summary of what this paper proposes.\n\n\
        ## Core Contribution\n\
        A bulleted list of key technical contributions.\n\n\
        ## Impact\n\
        Why this paper is important or what problem it solves.\n\n\
        **Note**: Use bolding for key terms. Ensure there is a blank line between sections and paragraphs for readability.\n\n\
        Here is the BibTeX for a computer science paper:\n\
        ```bibtex\n\
        {}\n\
        ```\n\n\
        Do not include \"Based on the BibTeX, ...\" in your response.",
        payload.bibtex
    );

    let req_body = GeminiGenerateRequest {
        contents: vec![GeminiContent {
            parts: vec![GeminiPart { text: prompt_text }],
        }],
    };

    for model in models {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent?key={}",
            model, api_key
        );

        let res = client
            .post(&url)
            .json(&req_body)
            .send()
            .await;

        match res {
            Ok(response) => {
                if !response.status().is_success() {
                    let status = response.status();
                    // If 429, continue to next model. Else break/error?
                    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
                        println!("Model {} rate limited, trying next...", model);
                        continue;
                    }
                    println!("Model {} failed with status {}", model, status);
                     // If it's a client error (400), maybe don't retry? But sticking to loop for safety.
                     continue;
                }

                // Streaming logic
                let stream = response.bytes_stream();
                
                let state_clone = state.clone();
                let cache_key_clone = cache_key.clone();
                
               

                
                return (
                     [("Content-Type", "text/plain; charset=utf-8"), ("X-Cache", "MISS")], 
                     process_stream(stream, state_clone, cache_key_clone)
                ).into_response();
            }
            Err(e) => {
                println!("Request failed: {}", e);
            }
        }
    }

    (
        axum::http::StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"error": "All models failed"}))
    ).into_response()
}

// Logic to process stream
fn process_stream(
    mut stream: impl futures::Stream<Item = reqwest::Result<bytes::Bytes>> + Unpin + Send + 'static,
    state: Arc<AppState>,
    cache_key: String,
) -> axum::body::Body {
    
    axum::body::Body::from_stream(async_stream::stream! {
        let mut buffer: Vec<u8> = Vec::new();
        let mut final_text = String::new();
        
        // Define error type for the stream
        type BoxError = Box<dyn std::error::Error + Send + Sync>;

        while let Some(chunk) = stream.next().await {
            if let Ok(bytes) = chunk {
                buffer.extend_from_slice(&bytes);
                
                // Hacky JSON array stream parser
                loop {
                    if buffer.is_empty() { break; }
                    
                    // Remove leading comma, whitespace, brackets
                    let mut start = 0;
                    while start < buffer.len() {
                        let b = buffer[start];
                        if b == b'[' || b == b']' || b == b',' || b.is_ascii_whitespace() {
                            start += 1;
                        } else {
                            break;
                        }
                    }
                    if start > 0 {
                        buffer.drain(0..start);
                    }
                    
                    if buffer.is_empty() { break; }
                    
                    // Now buffer starts with `{`. Find matching `}`.
                    let mut depth = 0;
                    let mut end = None;
                    let mut in_str = false;
                    let mut esc = false;
                    
                    for (i, &b) in buffer.iter().enumerate() {
                        if !in_str {
                            if b == b'{' { depth += 1; }
                            else if b == b'}' { 
                                depth -= 1; 
                                if depth == 0 {
                                    end = Some(i + 1);
                                    break;
                                }
                            } else if b == b'"' { in_str = true; }
                        } else {
                            if esc { esc = false; }
                            else if b == b'\\' { esc = true; }
                            else if b == b'"' { in_str = false; }
                        }
                    }
                    
                    if let Some(e) = end {
                        let obj_bytes = buffer.drain(0..e).collect::<Vec<u8>>();
                        if let Ok(chunk_json) = serde_json::from_slice::<GeminiResponseChunk>(&obj_bytes) {
                             if let Some(candidates) = chunk_json.candidates {
                                 for cand in candidates {
                                     if let Some(content) = cand.content {
                                         if let Some(parts) = content.parts {
                                             for part in parts {
                                                 if let Some(text) = part.text {
                                                     final_text.push_str(&text);
                                                     // Yield Result<String, BoxError>
                                                     yield Ok::<String, BoxError>(text);
                                                 }
                                             }
                                         }
                                     }
                                 }
                             }
                        }
                    } else {
                        // Incomplete object, wait for more data
                        break;
                    }
                }
            }
        }
        
        // Save to Redis
        if !final_text.is_empty() {
             if let Ok(mut con) = state.redis.get_multiplexed_async_connection().await {
                 let _ = con.set_ex::<_, _, String>(&cache_key, final_text, 2592000).await;
             }
        }
    })
}
