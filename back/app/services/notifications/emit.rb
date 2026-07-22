module Notifications
  # Fan-out a notification to every active member of the account except the actor.
  # Enqueued async on good_job: the job creates the rows and sends the emails.
  # Pass plain ids (not records) so a deleted notifiable can't break deserialization;
  # `data` is a JSON-serializable snapshot ({ message:, url: }) rendered once, here.
  module Emit
    module_function

    def call(account:, actor:, action:, notifiable: nil, data: {})
      NotifyJob.perform_later(
        account_id: account.id,
        actor_id: actor&.id,
        action: action,
        notifiable_type: notifiable&.class&.name,
        notifiable_id: notifiable&.id,
        data: data
      )
    end
  end
end
