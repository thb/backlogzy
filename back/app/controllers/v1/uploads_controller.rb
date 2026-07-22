module V1
  # Issues a presigned S3 PUT URL so the browser can upload a file directly to Scaleway.
  # The client then submits the returned `key` on the resource (e.g. customer[logo_key]).
  class UploadsController < ApplicationController
    ALLOWED_TYPES = %w[image/png image/jpeg image/webp].freeze

    # POST /v1/uploads  { filename, content_type }
    def create
      unless S3Storage.configured?
        return render_error("uploads_unconfigured", "File uploads are not configured", :service_unavailable)
      end

      content_type = params[:content_type].to_s
      unless ALLOWED_TYPES.include?(content_type)
        return render_error("unsupported_type", "Unsupported file type", :unprocessable_entity)
      end

      key = "uploads/#{current_account.id}/#{SecureRandom.uuid}/#{safe_filename(params[:filename])}"

      render json: { data: { key: key, url: S3Storage.presign_put(key: key, content_type: content_type) } }
    end

    private

    def safe_filename(name)
      File.basename(name.to_s).gsub(/[^a-zA-Z0-9._-]/, "_").presence || "file"
    end
  end
end
