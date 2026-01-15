use meilisearch_sdk::client::Client;
use meilisearch_sdk::indexes::Index;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;

#[derive(Serialize, Deserialize, Debug)]
struct PaperDoc {
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
    let db_url = std::env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new().connect(&db_url).await?;

    let meili = Client::new("http://localhost:7700", Some("1234"))?;
    let papers_index = meili.index("papers");

    setup_meili_settings(&meili, &papers_index).await?;

    let mut offset = 0;
    let batch_size = 10000;

    println!("Start indexing...");

    loop {
        let rows = sqlx::query!(
            r#"
            SELECT p.id, p.title, p.year, p.ee_link, v.raw_name as venue, 
                   ARRAY_AGG(a.name) as "authors!"
            FROM papers p
            JOIN venues v ON p.venue_id = v.id
            JOIN paper_authors pa ON p.id = pa.paper_id
            JOIN authors a ON pa.author_id = a.id
            GROUP BY p.id, v.raw_name, p.ee_link
            ORDER BY p.id ASC
            LIMIT $1 OFFSET $2
            "#,
            batch_size as i64,
            offset as i64
        )
        .fetch_all(&pool)
        .await?;

        if rows.is_empty() {
            break;
        }

        let docs: Vec<PaperDoc> = rows
            .into_iter()
            .map(|r| PaperDoc {
                id: r.id,
                title: r.title,
                year: r.year.unwrap_or(0),
                venue: r.venue,
                authors: r.authors,
                ee_link: r.ee_link,
            })
            .collect();

        papers_index.add_documents(&docs, Some("id")).await?;

        offset += batch_size;
        println!("Indexed total: {} papers", offset);
    }

    println!("All data with links has been successfully synced to Meilisearch.");
    Ok(())
}

async fn setup_meili_settings(client: &Client, index: &Index) -> anyhow::Result<()> {
    println!("Configuring Meilisearch settings...");

    let task = index.set_filterable_attributes(["venue", "year"]).await?;
    task.wait_for_completion(client, None, None).await?;

    let task = index.set_sortable_attributes(["year"]).await?;
    task.wait_for_completion(client, None, None).await?;

    let task = index
        .set_searchable_attributes(["title", "authors", "venue"])
        .await?;
    task.wait_for_completion(client, None, None).await?;

    println!("Meilisearch settings applied.");
    Ok(())
}