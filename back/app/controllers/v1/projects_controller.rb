module V1
  class ProjectsController < ApplicationController
    # GET /v1/projects — the board tabs; small collection, no pagination.
    def index
      render json: { data: V1::ProjectBlueprint.render_as_hash(current_account.projects.ordered) }
    end

    # POST /v1/projects
    def create
      record = current_account.projects.new(project_params)
      record.position = next_position if record.position.zero?
      record.save!
      render json: { data: V1::ProjectBlueprint.render_as_hash(record) }, status: :created
    end

    # PATCH/PUT /v1/projects/:id
    def update
      project.update!(project_params)
      render json: { data: V1::ProjectBlueprint.render_as_hash(project) }
    end

    # DELETE /v1/projects/:id — items go with it (dependent: :destroy).
    def destroy
      project.destroy!
      head :no_content
    end

    # POST /v1/projects/reorder  { ids: [...] } — full ordered list of project ids.
    def reorder
      Project.transaction do
        params.require(:ids).each_with_index do |id, index|
          current_account.projects.find(id).update!(position: index + 1)
        end
      end
      head :no_content
    end

    private

    def project
      @project ||= current_account.projects.find(params[:id])
    end

    def next_position
      (current_account.projects.maximum(:position) || 0) + 1
    end

    def project_params
      params.require(:project).permit(:name, :color, :position)
    end
  end
end
