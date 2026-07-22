require "rails_helper"

RSpec.describe ExampleJob, type: :job do
  include ActiveJob::TestHelper

  it "enqueues on the default queue" do
    expect { ExampleJob.perform_later("hi") }
      .to have_enqueued_job(ExampleJob).with("hi").on_queue("default")
  end

  it "performs without error" do
    expect { perform_enqueued_jobs { ExampleJob.perform_later("hi") } }.not_to raise_error
  end
end
