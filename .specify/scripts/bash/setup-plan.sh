#!/bin/bash
# Setup plan directories and files for a feature

set -e

JSON_OUTPUT=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --json) JSON_OUTPUT=true; shift ;;
        *) shift ;;
    esac
done

# Get current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# Find specs directory for current branch
SPECS_DIR="specs/${BRANCH}"
FEATURE_SPEC="${SPECS_DIR}/spec.md"
IMPL_PLAN="${SPECS_DIR}/plan.md"

# Create plan artifacts directories
mkdir -p "${SPECS_DIR}/contracts"
mkdir -p "${SPECS_DIR}/artifacts"

# Create plan.md if not exists
if [ ! -f "$IMPL_PLAN" ]; then
    touch "$IMPL_PLAN"
fi

if [ "$JSON_OUTPUT" = true ]; then
    cat <<JSONEOF
{
  "BRANCH": "$BRANCH",
  "SPECS_DIR": "$SPECS_DIR",
  "FEATURE_SPEC": "$FEATURE_SPEC",
  "IMPL_PLAN": "$IMPL_PLAN"
}
JSONEOF
else
    echo "Branch: $BRANCH"
    echo "Specs Dir: $SPECS_DIR"
    echo "Feature Spec: $FEATURE_SPEC"
    echo "Implementation Plan: $IMPL_PLAN"
fi
