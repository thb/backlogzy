# Example background job — runs on good_job (see config/application.rb).
# Enqueue with: ExampleJob.perform_later("hello"). Copy this shape for real jobs.
class ExampleJob < ApplicationJob
  queue_as :default

  def perform(message = "ping")
    Rails.logger.info("[ExampleJob] #{message}")
  end
end
