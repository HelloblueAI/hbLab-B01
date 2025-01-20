#!/bin/bash
# This script sets up aliases for the environment

# Define aliases file
ALIASES_FILE="$HOME/.aliases"

# Write aliases to the file
cat <<EOL > $ALIASES_FILE
# Git Aliases
alias gst="git status"
alias gcm="git commit -m"
alias gpl="git pull"
alias gps="git push"

# File System
alias lsa="ls -la"
EOL

# Ensure .aliases is sourced in .zshrc
if ! grep -q 'source ~/.aliases' ~/.zshrc; then
  echo '[ -f ~/.aliases ] && source ~/.aliases' >> ~/.zshrc
fi

# Reload Zsh configuration
source ~/.zshrc

echo "Aliases added and shell configuration updated successfully."

