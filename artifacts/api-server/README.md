# API Server

## Temporary skill ZIP uploads

Unreferenced ZIP uploads are retained for 30 days, then removed by a cleanup
that runs when the API server starts and every 24 hours afterward. Uploads
created within the retention window are treated as active and are not deleted.
Before deleting an older upload, cleanup checks whether any saved skill version
references its object path. Referenced objects are preserved.