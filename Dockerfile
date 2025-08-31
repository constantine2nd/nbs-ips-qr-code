FROM ruby:3.2-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    gcc \
    cmake \
    git \
    nodejs \
    npm

# Set working directory
WORKDIR /app

# Copy Gemfile and Gemfile.lock
COPY Gemfile* ./

# Install gems
RUN bundle install

# Copy application code
COPY . .

# Build Jekyll site
RUN bundle exec jekyll build

# Expose port
EXPOSE 4000

# Set environment variables
ENV JEKYLL_ENV=development
ENV BUNDLE_PATH=/usr/local/bundle

# Start Jekyll server
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", "--livereload", "--livereload-port", "35729", "--force_polling", "--incremental"]
