source "https://rubygems.org"

# Jekyll and plugins
gem "jekyll", "~> 4.3.2"
gem "jekyll-feed", "~> 0.12"

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock `http_parser.rb` gem to `v0.6.x` on JRuby builds since newer versions of the gem
# do not have a Java counterpart.
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]

# Webrick for Ruby 3.0+
gem "webrick", "~> 1.7"

# Additional gems for development
group :jekyll_plugins do
  gem "jekyll-sitemap"
  gem "jekyll-seo-tag"
end

# Development dependencies
group :development do
  gem "rake"
  gem "pry"
end
