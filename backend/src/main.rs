use axum::{
    Json, Router,
    extract::{Query, State},
    routing::get,
};
use meilisearch_sdk::client::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

struct AppState {
    meili: Client,
}

#[derive(Deserialize)]
struct SearchParams {
    q: Option<String>,
    venue: Option<String>,
    year: Option<i32>,
    limit: Option<usize>,
    page: Option<usize>,
    facets: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct PaperHit {
    id: i32,
    title: String,
    year: i32,
    venue: String,
    authors: Vec<String>,
    ee_link: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let meili_url = std::env::var("MEILI_URL").unwrap_or("http://localhost:7700".into());
    let meili_key = std::env::var("MEILI_MASTER_KEY").expect("MEILI_MASTER_KEY must be set");
    
    let state = Arc::new(AppState {
        meili: Client::new(meili_url, Some(meili_key))?,
    });

    let app = Router::new()
        .route("/search", get(search_papers))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = "0.0.0.0:8080";
    println!("High-performance Search API running on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn search_papers(
    State(state): State<Arc<AppState>>,
    Query(params): Query<SearchParams>,
) -> Json<serde_json::Value> {
    let index = state.meili.index("papers");
    let mut search = index.search();

    if let Some(ref q) = params.q {
        search.with_query(q);
    }

    let mut filters = Vec::new();
    if let Some(ref v) = params.venue {
        filters.push(format!("venue = \"{}\"", v));
    }
    if let Some(y) = params.year {
        filters.push(format!("year = {}", y));
    }

    let filter_str = if !filters.is_empty() {
        Some(filters.join(" AND "))
    } else {
        None
    };

    if let Some(ref f) = filter_str {
        search.with_filter(f);
    }
    
use meilisearch_sdk::search::Selectors;

    // Extend lifetime of facet_list to match search scope
    let facet_list: Vec<&str>;

    if let Some(ref facets) = params.facets {
        facet_list = facets.split(',').map(|s| s.trim()).collect();
        search.with_facets(Selectors::Some(&facet_list));
    }

    let limit = params.limit.unwrap_or(20);
    search.with_limit(limit);

    if let Some(page) = params.page {
         let offset = (page.saturating_sub(1)) * limit;
         search.with_offset(offset);
    }

    let results = search.execute::<PaperHit>().await.expect("Failed to execute search");

    Json(serde_json::to_value(results).unwrap())
}