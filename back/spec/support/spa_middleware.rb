# Rack middleware that serves the built SPA (front/dist) alongside the Rails API
# on a single port, so Capybara can drive the real React app end-to-end.
#
# Routing:
#   1. Existing static file in dist/  -> serve the file
#   2. API request (non-GET, or Accept: application/json) -> Rails
#   3. Browser navigation (GET + Accept: text/html) -> index.html (SPA entry)
class SpaMiddleware
  def initialize(app, dist_path:)
    @app = app
    @dist_path = dist_path
    @file_server = Rack::Files.new(dist_path)
  end

  def call(env)
    path = env["PATH_INFO"]

    static_file = File.join(@dist_path, path)
    if path != "/" && File.exist?(static_file) && !File.directory?(static_file)
      return @file_server.call(env)
    end

    return @app.call(env) if api_request?(env)

    serve_index
  end

  private

  def api_request?(env)
    return true unless env["REQUEST_METHOD"] == "GET"

    accept = env["HTTP_ACCEPT"].to_s
    return true if accept.include?("application/json")
    return false if accept.include?("text/html")

    true
  end

  def serve_index
    content = File.read(File.join(@dist_path, "index.html"))
    [200, { "content-type" => "text/html", "content-length" => content.bytesize.to_s }, [content]]
  end
end
