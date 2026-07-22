require "aws-sdk-s3"

# Direct-to-S3 uploads without Active Storage. The app only signs URLs; file bytes
# go browser ⇄ Scaleway directly. Configured via ENV (SCALEWAY_*).
module S3Storage
  PUT_TTL = 10.minutes
  GET_TTL = 1.hour

  module_function

  def configured?
    %w[SCALEWAY_ACCESS_KEY SCALEWAY_SECRET_KEY SCALEWAY_BUCKET_NAME].all? { |k| ENV[k].present? }
  end

  def region = ENV.fetch("SCALEWAY_REGION", "fr-par")
  def bucket = ENV["SCALEWAY_BUCKET_NAME"]

  def client
    Aws::S3::Client.new(
      access_key_id: ENV["SCALEWAY_ACCESS_KEY"],
      secret_access_key: ENV["SCALEWAY_SECRET_KEY"],
      region: region,
      endpoint: "https://s3.#{region}.scw.cloud"
    )
  end

  def presigner = Aws::S3::Presigner.new(client: client)

  # Presigned PUT URL the browser uploads to (must send the same Content-Type).
  def presign_put(key:, content_type:)
    presigner.presigned_url(:put_object, bucket: bucket, key: key, content_type: content_type, expires_in: PUT_TTL.to_i)
  end

  # Presigned GET URL to display a stored object. Degrades to nil if no key or S3
  # isn't configured — so responses embedding *_url never crash without creds.
  def presign_get(key, expires_in: GET_TTL.to_i)
    return nil if key.blank? || !configured?

    presigner.presigned_url(:get_object, bucket: bucket, key: key, expires_in: expires_in)
  end
end
