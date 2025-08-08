#!/bin/bash
# Preserve your brain - run this immediately
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r .stigmergy-core .stigmergy-core-BACKUP-$TIMESTAMP
tar czvf stigmergy-brain-$TIMESTAMP.tar.gz .stigmergy-core
echo "Core backup created: stigmergy-brain-$TIMESTAMP.tar.gz"
