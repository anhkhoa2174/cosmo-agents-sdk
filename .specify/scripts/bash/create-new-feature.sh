#!/bin/bash

# Create a new feature branch and initialize spec file
# Usage: create-new-feature.sh --json [--number N] [--short-name "name"] "Feature description"

set -e

# Parse arguments
JSON_OUTPUT=false
NUMBER=""
SHORT_NAME=""
DESCRIPTION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --number)
            NUMBER="$2"
            shift 2
            ;;
        --short-name)
            SHORT_NAME="$2"
            shift 2
            ;;
        *)
            DESCRIPTION="$1"
            shift
            ;;
    esac
done

if [ -z "$SHORT_NAME" ]; then
    echo "Error: --short-name is required" >&2
    exit 1
fi

if [ -z "$NUMBER" ]; then
    NUMBER=1
fi

# Create branch name and paths
BRANCH_NAME="${NUMBER}-${SHORT_NAME}"
FEATURE_DIR="specs/${BRANCH_NAME}"
SPEC_FILE="${FEATURE_DIR}/spec.md"

# Create feature directory
mkdir -p "$FEATURE_DIR"
mkdir -p "${FEATURE_DIR}/checklists"

# Create git branch if in a git repo
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    # Check if branch exists
    if git show-ref --verify --quiet refs/heads/"$BRANCH_NAME"; then
        git checkout "$BRANCH_NAME"
    else
        git checkout -b "$BRANCH_NAME"
    fi
fi

# Initialize empty spec file
touch "$SPEC_FILE"

# Output result
if [ "$JSON_OUTPUT" = true ]; then
    cat <<EOF
{
  "BRANCH_NAME": "$BRANCH_NAME",
  "FEATURE_DIR": "$FEATURE_DIR",
  "SPEC_FILE": "$SPEC_FILE",
  "NUMBER": $NUMBER,
  "SHORT_NAME": "$SHORT_NAME",
  "DESCRIPTION": $(echo "$DESCRIPTION" | jq -R .)
}
EOF
else
    echo "Created feature: $BRANCH_NAME"
    echo "Spec file: $SPEC_FILE"
fi
