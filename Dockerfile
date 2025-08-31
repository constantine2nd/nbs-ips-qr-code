FROM ruby:3.2-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    gcc \
    cmake \
    git \
    nodejs \
    npm \
    curl

# Set working directory
WORKDIR /app

# Copy Gemfile and Gemfile.lock
COPY Gemfile* ./

# Add platform compatibility and install gems
RUN bundle lock --add-platform x86_64-linux \
    && bundle install

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
