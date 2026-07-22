require "capybara/rspec"

# Paths relative to the monorepo (back/ and front/ are siblings).
SPA_ROOT_PATH = File.expand_path("../../../front", __dir__)
SPA_DIST_PATH = File.join(SPA_ROOT_PATH, "dist")
SYSTEM_TEST_PORT = ENV.fetch("SYSTEM_TEST_PORT", 4011).to_i

def spa_present? = File.directory?(SPA_ROOT_PATH)

# Rebuild the SPA (test mode) when its sources are newer than the last build.
def spa_dist_stale?
  return false unless spa_present?

  index = File.join(SPA_DIST_PATH, "index.html")
  return true unless File.exist?(index)

  src_dir = File.join(SPA_ROOT_PATH, "src")
  return false unless File.directory?(src_dir)

  dist_mtime = File.mtime(index)
  Dir.glob(File.join(src_dir, "**", "*")).any? { |f| File.file?(f) && File.mtime(f) > dist_mtime }
end

if spa_present? && spa_dist_stale?
  puts "\n⚡ SPA dist outdated — rebuilding (npm run build:test)..."
  system("cd #{SPA_ROOT_PATH} && npm run build:test") || abort("SPA build failed!")
  puts "✓ SPA rebuilt\n"
end

if File.exist?(File.join(SPA_DIST_PATH, "index.html"))
  Capybara.app = SpaMiddleware.new(Rails.application, dist_path: SPA_DIST_PATH)
end

Capybara.configure do |config|
  config.server_port = SYSTEM_TEST_PORT
  config.app_host = "http://localhost:#{SYSTEM_TEST_PORT}"
  config.default_max_wait_time = 5
end

Capybara.register_driver :headless_chrome do |app|
  options = Selenium::WebDriver::Chrome::Options.new
  options.add_argument("--headless=new")
  options.add_argument("--no-sandbox")
  options.add_argument("--disable-gpu")
  options.add_argument("--disable-dev-shm-usage")
  options.add_argument("--window-size=1280,800")
  Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
end

Capybara.default_driver = :rack_test
Capybara.javascript_driver = :headless_chrome

RSpec.configure do |config|
  config.before(:each, type: :feature, js: true) { Capybara.current_driver = :headless_chrome }
  config.include FeatureHelper, type: :feature
end
