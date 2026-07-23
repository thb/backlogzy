module V1
  class ItemsController < ApplicationController
    has_scope :by_project, as: :project_id, allow_blank: false
    has_scope :by_kind, as: :kind, allow_blank: false

    # GET /v1/items?project_id=... (board) or ?kind=task (planning, all projects).
    # Whole collection, ordered by position — the board needs every row.
    # Archived items are excluded unless ?with_archived=true.
    def index
      scoped = apply_scopes(current_account.items)
      scoped = scoped.active unless truthy?(params[:with_archived])
      render json: { data: V1::ItemBlueprint.render_as_hash(scoped.ordered) }
    end

    # POST /v1/items
    def create
      project = current_account.projects.find(item_params[:project_id])
      record = project.items.new(item_params.except(:project_id))
      record.save!
      render json: { data: V1::ItemBlueprint.render_as_hash(record) }, status: :created
    end

    # PATCH/PUT /v1/items/:id — project_id changes (planning drag across projects)
    # are re-resolved inside the account, so items can't escape the tenant.
    def update
      attrs = item_params
      if attrs[:project_id].present? && attrs[:project_id] != item.project_id
        attrs = attrs.merge(project_id: current_account.projects.find(attrs[:project_id]).id)
      end
      item.update!(attrs)
      render json: { data: V1::ItemBlueprint.render_as_hash(item) }
    end

    # DELETE /v1/items/:id
    def destroy
      item.destroy!
      head :no_content
    end

    # POST /v1/items/reorder  { ids: [...] } — full ordered list for one board.
    def reorder
      Item.transaction do
        params.require(:ids).each_with_index do |id, index|
          current_account.items.find(id).update!(position: index + 1)
        end
      end
      head :no_content
    end

    # POST /v1/items/archive  { ids: [...], archived: true|false } — bulk toggle.
    # The front sends a whole section block (separator + its tasks) in one call.
    def archive
      stamp = truthy?(params[:archived]) ? Time.current : nil
      Item.transaction do
        params.require(:ids).each do |id|
          current_account.items.find(id).update!(archived_at: stamp)
        end
      end
      head :no_content
    end

    private

    def truthy?(value)
      ActiveModel::Type::Boolean.new.cast(value) == true
    end

    def item
      @item ||= current_account.items.find(params[:id])
    end

    def item_params
      params.require(:item).permit(:project_id, :kind, :description, :label, :status,
                                   :estimation, :time_spent, :notes, :planned_start,
                                   :planned_end, :completed_at, :position)
    end
  end
end
