class AddSentAtToInvitations < ActiveRecord::Migration[8.0]
  def up
    add_column :invitations, :sent_at, :datetime, if_not_exists: true
    execute "UPDATE invitations SET sent_at = created_at WHERE sent_at IS NULL"
  end

  def down
    remove_column :invitations, :sent_at
  end
end
