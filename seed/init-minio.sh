#!/bin/sh
set -e

mc alias set local http://minio:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
mc mb --ignore-existing local/"$MINIO_BUCKET"

# Generate a minimal valid blank PDF (307 bytes, opens as empty white page)
make_pdf() {
  printf '%%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 3 3]>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000054 00000 n \n0000000105 00000 n \ntrailer\n<</Root 1 0 R/Size 4>>\nstartxref\n167\n%%%%EOF\n' > "$1"
}

make_pdf /tmp/receipt_march.pdf
make_pdf /tmp/expense_detail_march.pdf
make_pdf /tmp/aws_training_brochure.pdf
make_pdf /tmp/laptop_spec.pdf
make_pdf /tmp/privacy_policy_2026.pdf

mc cp /tmp/receipt_march.pdf        local/"$MINIO_BUCKET"/a0000001-seed-4000-b000-000000000001_receipt_march.pdf
mc cp /tmp/expense_detail_march.pdf local/"$MINIO_BUCKET"/a0000002-seed-4000-b000-000000000002_expense_detail_march.pdf
mc cp /tmp/aws_training_brochure.pdf local/"$MINIO_BUCKET"/a0000003-seed-4000-b000-000000000003_aws_training_brochure.pdf
mc cp /tmp/laptop_spec.pdf          local/"$MINIO_BUCKET"/a0000004-seed-4000-b000-000000000004_laptop_spec.pdf
mc cp /tmp/privacy_policy_2026.pdf  local/"$MINIO_BUCKET"/a0000005-seed-4000-b000-000000000005_privacy_policy_2026.pdf
