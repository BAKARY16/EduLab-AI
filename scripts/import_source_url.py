import argparse
import json
from datetime import datetime, timezone
from urllib.parse import urlparse

ALLOWED_DOMAINS = {"dpfc-ci.net", "ecole-ci.org", "education.gouv.ci", "men-deco.org", "gouv.ci", "www.fomesoutra.com"}

parser = argparse.ArgumentParser()
parser.add_argument("--url", required=True)
parser.add_argument("--mode", choices=["metadata_only"], default="metadata_only")
args = parser.parse_args()
host = urlparse(args.url).hostname or ""
if host not in ALLOWED_DOMAINS:
    raise SystemExit("Domaine non autorisé")
print(json.dumps({"url": args.url, "mode": args.mode, "content_available": False, "checked_at": datetime.now(timezone.utc).isoformat()}))
