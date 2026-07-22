class CreateIdentities < ActiveRecord::Migration[8.0]
  def change
    create_table :identities, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.string :provider, null: false
      t.string :uid, null: false
      t.string :email
      t.timestamps
    end
    add_index :identities, %i[provider uid], unique: true
  end
end
