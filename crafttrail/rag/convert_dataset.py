"""
convert_dataset.py — Converts the user's TSV craft dataset into RAG-friendly text
and copies both data files to rag/data/ for ingestion.
"""
import csv
import os
import shutil
from collections import defaultdict

DESKTOP = r"C:\Users\Narasimha Reddy\OneDrive\Desktop"
RAG_DATA = os.path.join(os.path.dirname(__file__), "data")

# ── 1. Copy rag information.txt directly (already well-formatted) ────────
src_rag = os.path.join(DESKTOP, "rag information.txt")
dst_rag = os.path.join(RAG_DATA, "rag_information_north_south_india.txt")
if os.path.exists(src_rag):
    shutil.copy2(src_rag, dst_rag)
    print(f"  ✓ Copied rag information.txt → {dst_rag}")
    print(f"    Size: {os.path.getsize(dst_rag):,} bytes")
else:
    print(f"  ✗ Not found: {src_rag}")

# ── 2. Convert Final Dataset Craft.txt (TSV) → readable text ────────────
src_tsv = os.path.join(DESKTOP, "Final Dataset Craft.txt")
dst_txt = os.path.join(RAG_DATA, "artisan_dataset_all_states.txt")

if not os.path.exists(src_tsv):
    print(f"  ✗ Not found: {src_tsv}")
    exit(1)

# Parse TSV and deduplicate by (state, craft, district, heritageNote)
seen = set()
crafts_by_state = defaultdict(list)

with open(src_tsv, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    for row in reader:
        state = (row.get("state") or "").strip()
        craft = (row.get("craft") or "").strip()
        district = (row.get("district") or "").strip()
        heritage = (row.get("heritageNote") or "").strip()
        desc = (row.get("description") or "").strip()
        sig = (row.get("significance") or "").strip()
        odop = (row.get("odopProduct") or "").strip()
        coords = (row.get("coordinates") or "").strip()
        address = (row.get("Address") or "").strip()
        looms = (row.get("Looms Available") or "").strip()
        
        if not state or not craft:
            continue
        
        key = (state, craft, district)
        if key in seen:
            continue
        seen.add(key)
        
        crafts_by_state[state].append({
            "craft": craft,
            "district": district,
            "heritage": heritage,
            "description": desc,
            "significance": sig,
            "odop": odop,
            "coordinates": coords,
            "address": address,
            "looms": looms,
        })

# Write as structured text grouped by state
with open(dst_txt, "w", encoding="utf-8") as out:
    out.write("CRAFTTRAIL ARTISAN DATABASE — ALL INDIA CRAFT CLUSTERS\n")
    out.write("=" * 60 + "\n")
    out.write(f"Total unique craft entries: {len(seen)}\n")
    out.write(f"States/UTs covered: {len(crafts_by_state)}\n\n")
    
    for state in sorted(crafts_by_state.keys()):
        entries = crafts_by_state[state]
        out.write("━" * 60 + "\n")
        out.write(f"STATE: {state.upper()}\n")
        out.write(f"Craft clusters in database: {len(entries)}\n")
        out.write("━" * 60 + "\n\n")
        
        for e in entries:
            out.write(f"Craft: {e['craft']}\n")
            out.write(f"District: {e['district']}, {state}\n")
            if e["coordinates"]:
                out.write(f"Location: {e['coordinates']}\n")
            if e["significance"]:
                out.write(f"Cultural Significance: {e['significance']}/10\n")
            if e["heritage"]:
                out.write(f"Heritage: {e['heritage']}\n")
            if e["description"]:
                out.write(f"Description: {e['description']}\n")
            if e["odop"]:
                out.write(f"ODOP Product: {e['odop']}\n")
            if e["address"]:
                out.write(f"Address: {e['address']}\n")
            if e["looms"] and e["looms"] != "N/A":
                out.write(f"Looms Available: {e['looms']}\n")
            out.write("\n")

print(f"  ✓ Converted TSV → {dst_txt}")
print(f"    {len(seen)} unique craft entries across {len(crafts_by_state)} states")
print(f"    Size: {os.path.getsize(dst_txt):,} bytes")
print("\nDone! Now run:  python ingest.py")
