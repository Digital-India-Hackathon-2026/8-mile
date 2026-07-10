# CraftTrail RAG — Knowledge Base Files

Drop your custom documents here. Supported formats:

| Format | Examples |
|--------|---------|
| `.pdf` | Government craft reports, artisan brochures, tourism documents |
| `.txt` | Your own handwritten notes, craft descriptions |
| `.md`  | Markdown documents |
| `.csv` | Craft cluster data, artisan lists, GI product registry |
| `.xlsx`| Excel spreadsheets with craft/cluster data |

## After adding files

Run in the `rag/` folder:
```
python ingest.py
```

This re-indexes everything. You can run it as many times as you want — it won't duplicate data.

## Already indexed by default (no files needed)

- Heritage info for all 16 Indian states
- Crafts, GI tags, products, culture, cluster locations
- CraftTrail platform info (booking, trust system, Pehchan cards)
- Artisan profiles from MongoDB (if server is running)
