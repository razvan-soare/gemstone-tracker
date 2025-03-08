#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No color

# Emoji icons
STARTING_ICON="🎇"
SUCCESS_ICON="✅"
ERROR_ICON="❌"
UPDATING_ICON="🚀"

# Your JSON file path
json_file="app.json"

# Define the expo_sdk_version variable
expo_sdk_version="049"

# Get the update type argument (major, minor, or patch)
update_type="$1"

# Validate the update type argument
if [ -z "$update_type" ] || ! [[ "$update_type" =~ ^(major|minor|patch)$ ]]; then
  echo -e "${RED}${ERROR_ICON} Use one of this for the update <major|minor|patch>${NC}"
  exit 1
fi

# Check if the JSON file exists
if [ ! -f "$json_file" ]; then
  echo -e "${RED}${ERROR_ICON} Error: JSON file not found at path: $json_file${NC}"
  exit 1
fi

# Display a starting message with an emoji
echo -e "${GREEN}${STARTING_ICON} Starting the update process... ${STARTING_ICON}${NC}"

# Extract the current version, buildNumber, and versionCode from the JSON file
current_version=$(jq -r '.expo.version' "$json_file")
current_build_number=$(jq -r '.expo.ios.buildNumber' "$json_file")
current_version_code=$(jq -r '.expo.android.versionCode' "$json_file")

# Split the version into major, minor, and patch components
IFS='.' read -r -a version_parts <<< "$current_version"

# Calculate the new versionCode based on the version with the expo_sdk_version prefix
new_version_code="${expo_sdk_version}$(printf "%02d" "${version_parts[0]}")$(printf "%02d" "${version_parts[1]}")$(printf "%02d" "${version_parts[2]}")"

# Update the appropriate version component
case "$update_type" in
  "major")
    ((version_parts[0]++))
     version_parts[1]=0
     version_parts[2]=0
    ;;
  "minor")
    ((version_parts[1]++))
     version_parts[2]=0
    ;;
  "patch")
    ((version_parts[2]++))
    ;;
esac

# Ensure that the new version components are within the range 0-99
for i in "${!version_parts[@]}"; do
  if ((version_parts[i] < 0)); then
    version_parts[i]=0
  elif ((version_parts[i] > 99)); then
    version_parts[i]=99
  fi
done

# Create the new version string
new_version="${version_parts[0]}.${version_parts[1]}.${version_parts[2]}"

# Calculate the new versionCode dynamically
new_version_code_dynamic="${expo_sdk_version}$(printf "%02d" "${version_parts[0]}")$(printf "%02d" "${version_parts[1]}")$(printf "%02d" "${version_parts[2]}")"

# Update the version, buildNumber, and versionCode fields in the JSON file
jq --arg new_version "$new_version" --arg new_version_code "$new_version_code_dynamic" '.expo.version = $new_version | .expo.ios.buildNumber = $new_version | .expo.android.versionCode = ($new_version_code | tonumber)' "$json_file" > tmp.json && mv tmp.json "$json_file"

# Display a success message with an emoji
echo -e "${GREEN} version, buildNumber and versionCode updated ${UPDATING_ICON}${NC}"
echo -e "${GREEN}${SUCCESS_ICON}${NC} version: $new_version"
echo -e "${GREEN}${SUCCESS_ICON}${NC} buildNumber: $new_version"
echo -e "${GREEN}${SUCCESS_ICON}${NC} versionCode: $new_version_code_dynamic"
