import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class SkateboardingGame extends Scene {
    constructor() {
        super();
        // Shapes
        this.shapes = {
            // Existing shapes
            ...this.shapes,
            // Add a plane for the road
            road: new defs.Cube(),
            // Simple shape for skateboarder
            skateboarder: new defs.Subdivision_Sphere(4),
            dashed_line: new defs.Cube(),
            // Obstacles (example: simple cube)
            obstacle: new defs.Cube(),
            obstacleJump: new defs.Capped_Cylinder(1, 10, [[0, 2], [0, 1]]),
            obstacleCone: new defs.Cone_Tip(4, 10, [[0, 2], [0, 1]]),
        };

        // Materials
        this.materials = {
            // Existing materials
            ...this.materials,
            // Road material
            road: new Material(new defs.Phong_Shader(),
                {ambient: 0.3, diffusivity: 0.6, color: hex_color("#808080")}),
            dashed_line: new Material(new defs.Phong_Shader(),
                {ambient: 0.3, diffusivity: 0.6, color: hex_color("#FFFF00")}),
            // Skateboarder material
            skateboarder: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#ffa500")}),
            // Obstacle material
            obstacle: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#ff0000")}),
            obstacleJump: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#ff0500")}),
            obstacleCone: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#ff0500")}),
        };

        // Initial camera location (adjust as needed)
        this.initial_camera_location = Mat4.look_at(
            vec3(0, 10, 15),  // Position adjusted for your coordinate system
            vec3(0, 0, -5),  // Pointing West (negative X direction)
            vec3(0, 1, 0)                // Up is the positive Y direction
        );
        
        this.pos = 0;
        this.jump = 0;
        this.xval = [];
        this.zval = [];
        this.obstacle_type = [];

        ///////////////////////////// Road Lines ////////////////////////////////
        this.road_lines = []; // Array to store road line transforms
        this.num_lines = 25; // Num of road lines
        this.line_spacing = 15; // Spacing between lines
        this.line_speed = 20; // Speed of movement
        this.road_line_cutoff = 10; // Cutoff to reset road_line to 
        this.road_line_initial = -this.line_spacing*(this.num_lines-1); // z position to reinitialize road_line transform

        // Initialize road lines in road_strips array
        for (let i = 0; i < this.num_lines; i++) {
            let initial_z = -this.line_spacing * i;

            // Create a transformation for the line segment
            this.road_lines[i] = Mat4.identity()
                .times(Mat4.translation(0, 1, initial_z)) // Position the line segment
                .times(Mat4.scale(0.1, 0.1, 1)); // Scale to make it look like a line
            //console.log(this.road_lines[i])
        }
        //////////////////////////////////////////////////////////////////////////


        ///////////////////////////// Obstacles /////////////////////////////////
        this.obstacles = [];
        this.num_obstacles = 50;
        this.obstacle_initial = -150;
        this.obstacle_cutoff = 10;
        this.max_dist = 20;
        this.min_dist = 15;


        for (let i = 0; i < this.num_obstacles; i++) {
            // Generate random x value position (lateral)
            const obstacle_positions = [-2, 0, 2];
            const random_index = Math.floor(Math.random() * obstacle_positions.length);
            this.xval[i] = obstacle_positions[random_index];

            // Generate random z value position (depth)
            if (i == 0) {
                this.zval[0] = -100-Math.floor(Math.random() * (this.max_dist - this.min_dist) + this.min_dist);
            }
            else {
                this.zval[i] = this.zval[i-1]-Math.floor(Math.random() * (this.max_dist - this.min_dist) + this.min_dist);
            }
            // Generate random obstacle type
            const random_number = Math.random();
            if (random_number < 0.1) {
                this.obstacle_type[i] = 1; // Set as jump obstacle
            } else if (random_number >= 0.1 && random_number < 0.2) {
                this.obstacle_type[i] = 2; // Set as cone obstacle
            } else {
                this.obstacle_type[i] = 0; // Set as regular obstacle
            }

            let initial_z = this.zval[i];

            // Initialize obstacle transform based on the obstacle type
            if (this.obstacle_type[i] === 0) {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, initial_z)) 
                    .times(Mat4.scale(0.8, 0.8, 0.8)); 

            } else if (this.obstacle_type[i] === 2) {
                
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, initial_z)) 
                    .times(Mat4.scale(0.8, 0.8, 0.8)); 


            } else {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, initial_z)) 
                    .times(Mat4.scale(5, 0.8, 0.8)); // Scale the obstacle
            }
        }
        //////////////////////////////////////////////////////////////////////////
      
    }


    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        // this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => null);
        // this.new_line();
        // this.key_triggered_button("Attach to planet 1", ["Control", "1"], () => this.attached = () => this.planet_1);
        // this.key_triggered_button("Attach to planet 2", ["Control", "2"], () => this.attached = () => this.planet_2);
        // this.new_line();
        // this.key_triggered_button("Attach to planet 3", ["Control", "3"], () => this.attached = () => this.planet_3);
        // this.key_triggered_button("Attach to planet 4", ["Control", "4"], () => this.attached = () => this.planet_4);
        // this.new_line();
        // this.key_triggered_button("Attach to moon", ["Control", "m"], () => this.attached = () => this.moon);
        this.key_triggered_button("Left", ["q"], () => {
            if (this.pos === 0 || this.pos === 1) {
                // Shift the skateboarder to the left
                this.pos -= 1; // Update the position to move left
            }
        });
        this.key_triggered_button("Right", ["e"], () => {
            if (this.pos === -1 || this.pos === 0) {
                // Shift the skateboarder to the right 
                this.pos += 1; // Update the position to move right
            }
        });
        this.key_triggered_button("Jump", ["t"], () => {
            // Adjust the skateboarder's position upwards for a jump
            this.jump = 1;
        });
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // Setup lighting
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let dz = (dt * this.line_speed);


        let road_transform = Mat4.identity().times(Mat4.scale(5, 1, 150));
        this.shapes.road.draw(context, program_state, road_transform, this.materials.road);

        // Display road lines
        for (let i = 0; i < this.num_lines; i++) {
            //let initial_z = -this.line_spacing*i;
            
            // Translate road lines by z_position
            this.road_lines[i] = this.road_lines[i].times(Mat4.translation(0, 0, dz)); // Position the line segment

            // Draw the line segment
            //if (this.road_lines[i].z > this.road_line_cutoff)
            this.shapes.dashed_line.draw(context, program_state, this.road_lines[i], this.materials.dashed_line);

            // Update to back of line if passed Cutoff
            if (this.road_lines[i][2][3] > this.line_spacing) {
                this.road_lines[i] = Mat4.identity()
                .times(Mat4.translation(0, 1, this.road_lines[(i+this.num_lines-1)%this.num_lines][2][3]+dz-this.line_spacing)) // Position the line segment
                .times(Mat4.scale(0.1, 0.1, 1)); // Scale to make it look like a line
            }         
        }

        let skateboarder_transform = Mat4.identity().times(Mat4.translation(2*this.pos, 2, 0));
        
        if (this.jump == 1) {
            const jump_duration = 0.5; 
            const jump_height_max = 2;
            const jump_height_min = 1;

            if (!("start_time" in this)) {
                this.start_time = t; // Record the start time if not already set
            }

            let jump_progress = Math.min(t - this.start_time, jump_duration);
            //console.log(this.t - this.start_time);
            let jump_height_at_time = jump_height_min + (0.5*(jump_height_max-jump_height_min)) * Math.sin((Math.PI / jump_duration) * jump_progress);

            skateboarder_transform = Mat4.identity().times(Mat4.translation(2*this.pos, jump_height_at_time*2, 0));
            if (jump_progress >= jump_duration) {
                this.jump = 0;
                delete this.start_time;
            }
        } else {
            skateboarder_transform = Mat4.identity().times(Mat4.translation(2*this.pos, 2, 0));
        }
        // Draw the skateboarder
        this.shapes.skateboarder.draw(context, program_state, skateboarder_transform, this.materials.skateboarder);


       
        // Obstacle
        for (let i = 0; i < this.num_obstacles; i++ ) {

            this.obstacles[i] = this.obstacles[i].times(Mat4.translation(0, 0, dz));
            
            // Draw correct object type
            if (this.obstacle_type[i] === 0) {
                
                this.shapes.obstacle.draw(context, program_state, this.obstacles[i], this.materials.obstacle);
            } else if (this.obstacle_type[i] === 2) {
                // Rotate
                let rotated_transform = this.obstacles[i].times(Mat4.rotation(-Math.PI/2, 1, 0, 0))

                this.shapes.obstacleCone.draw(context, program_state, rotated_transform, this.materials.obstacle);
            } else {

                // Translate
                this.obstacles[i] = this.obstacles[i].times(Mat4.translation(0, 0, dz));

                // Rotate
                let rotated_transform = this.obstacles[i].times(Mat4.rotation(Math.PI/2, 0, 1, 0))

                this.shapes.obstacleJump.draw(context, program_state, rotated_transform, this.materials.obstacle);
            }

            // Initialize obstacle transform based on the obstacle type if passed threshold
            if (this.obstacles[i][2][3] > this.obstacle_cutoff) {
                // Generate random x value position (lateral)
                const obstacle_positions = [-2, 0, 2];
                const random_index = Math.floor(Math.random() * obstacle_positions.length);
                let x_pos = obstacle_positions[random_index];
    
                // Generate random z value position (depth)
                let z_offset = (Math.random() * (this.max_dist - this.min_dist) + this.min_dist);
                
                // Generate random obstacle type
                const random_number = Math.random();
                if (random_number < 0.1) {
                    this.obstacle_type[i] = 1; // Set as jump obstacle
                } else if (random_number >= 0.1 && random_number < 0.2) {
                    this.obstacle_type[i] = 2; // Set as cone obstacle
                } else {
                    this.obstacle_type[i] = 0; // Set as regular obstacle
                } 

                // Position new random object at back of line
                if (this.obstacle_type[i] === 0) {
                    this.obstacles[i] = Mat4.identity()
                        .times(Mat4.translation(x_pos, 2, this.obstacles[(i+this.num_obstacles-1)%this.num_obstacles][2][3]+dz-z_offset)) 
                        .times(Mat4.scale(0.8, 0.8, 0.8)); 
    
                } else if (this.obstacle_type[i] === 2) {
                    this.obstacles[i] = Mat4.identity()
                        .times(Mat4.translation(x_pos, 2, this.obstacles[(i+this.num_obstacles-1)%this.num_obstacles][2][3]+dz-z_offset)) 
                        .times(Mat4.scale(0.8, 0.8, 0.8)); 
                        
                } else {
                    this.obstacles[i] = Mat4.identity()
                        .times(Mat4.translation(x_pos, 2, this.obstacles[(i+this.num_obstacles-1)%this.num_obstacles][2][3]+dz-z_offset)) 
                        .times(Mat4.scale(5, 0.8, 0.8)); // Scale the obstacle
                
                }
            }
        }
            
    }
}


