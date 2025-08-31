FROM ruby:3.2

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Gemfile only (not Gemfile.lock to avoid platform conflicts)
COPY Gemfile ./

# Generate new Gemfile.lock for current platform and install gems
# This ensures all gems are properly installed for x86_64-linux
RUN bundle config set --local path /usr/local/bundle && \
    bundle config set --local deployment false && \
    bundle install

# Copy application code
COPY . .

# Build Jekyll site for production
RUN JEKYLL_ENV=production bundle exec jekyll build

# Expose port
EXPOSE 4000

# Set environment variables
ENV JEKYLL_ENV=production
ENV BUNDLE_PATH=/usr/local/bundle

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4000/health.html || exit 1

# Start Jekyll server
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", "--no-watch", "--skip-initial-build"]
