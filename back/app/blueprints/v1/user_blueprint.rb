module V1
  class UserBlueprint < Blueprinter::Base
    identifier :id

    fields :name, :email, :super_admin

    field(:avatar_url) { |user| S3Storage.presign_get(user.avatar_key) }

    view :with_memberships do
      field :accounts do |user|
        user.account_memberships.active.includes(:account).map do |membership|
          {
            id: membership.account_id,
            slug: membership.account.slug,
            name: membership.account.name,
            role: membership.role
          }
        end
      end
    end
  end
end
