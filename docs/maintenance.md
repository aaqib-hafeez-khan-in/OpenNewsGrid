# Maintenance Notes

## News aggregation

- Treat publisher RSS/API timestamps as source data and keep freshness handling centralized in the aggregation layer.
- When adding a feed, verify its URL, country, language, category, and publication timestamp behavior.
- Prefer source links for full articles; keep OpenNewsGrid previews concise and publisher-attributed.
- Test homepage, category, country, region, and article routes after feed or routing changes.
