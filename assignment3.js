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
        
        this.obstacles = [];
        this.num_obstacles = 50;

        for (let i = 0; i < this.num_obstacles; i++) {
            const obstacle_positions = [-2, 0, 2];
            const random_index = Math.floor(Math.random() * obstacle_positions.length);
            this.xval[i] = obstacle_positions[random_index];

            if (this.xval[i] == -2) {
                this.zval[i] = -50*i;
            } else if (this.xval[i] == 0) {
                this.zval[i] = -80*i;
            } else {
                this.zval[i] = -95*i;
            }           
        }
        

        
        //for ()

        for (let i = 0; i < 5000; i++) {
            const obstacle_positions = [-2, 0, 2];
            const random_index = Math.floor(Math.random() * obstacle_positions.length);
            this.xval[i] = obstacle_positions[random_index];

            if (this.xval[i] == -2) {
                this.zval[i] = -50*i;
            } else if (this.xval[i] == 0) {
                this.zval[i] = -80*i;
            } else {
                this.zval[i] = -95*i;
            }

            const random_number = Math.random();
            if (random_number < 0.1) {
                this.obstacle_type[i] = 1; // Set as jump obstacle
            } else if (random_number >= 0.1 && random_number < 0.2) {
                this.obstacle_type[i] = 2; // Set as cone obstacle
            } else {
                this.obstacle_type[i] = 0; // Set as regular obstacle
            }
        }
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


        let road_transform = Mat4.identity().times(Mat4.scale(5, 1, 150));
        this.shapes.road.draw(context, program_state, road_transform, this.materials.road);

        // Display road lines
        for (let i = 0; i < this.num_lines; i++) {
            console.log(this.road_lines[i]);
            //let initial_z = -this.line_spacing*i;
            
            // Calculate the new position based on animation time
            let dz = (program_state.animation_delta_time / 1000 * (this.line_speed));

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


       
        // const box_spacing = 25;
        // Obstacle
        /*for (let i = 0; i < 50; i++ ) {
            // const obstacle_positions = [-2, 0, 2];
            // const random_index = Math.floor(Math.random() * obstacle_positions.length);
            // const obstacle_x = obstacle_positions[random_index];

            // const obstacle_z_positions = Array.from({ length: 39 }, (_, index) => -100 - index * 50);
            // const random_index_z = Math.floor(Math.random() * obstacle_z_positions.length);
            // const obstacle_z = obstacle_z_positions[random_index_z];

            // let z_position = (obstacle_z + program_state.animation_time / 1000 * line_speed) % (num_lines * line_spacing);

            let initial_z = this.zval[i];

            // Calculate the new position based on animation time
            let z_position = (initial_z + program_state.animation_time / 1000 * line_speed) % (num_lines * line_spacing);

            if (this.obstacle_type[i] === 0) {
                let obstacle_transform = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, z_position)) 
                    .times(Mat4.scale(0.8, 0.8, 0.8)); 

                    this.shapes.obstacle.draw(context, program_state, obstacle_transform, this.materials.obstacle);
            } else if (this.obstacle_type[i] === 2) {
                let obstacle_transform_cone = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, z_position)) 
                    .times(Mat4.scale(0.8, 0.8, 0.8)); 
                
                    obstacle_transform_cone = obstacle_transform_cone.times(Mat4.rotation(-Math.PI/2, 1, 0, 0));

                this.shapes.obstacleCone.draw(context, program_state, obstacle_transform_cone, this.materials.obstacle);
            } else {
                let obstacle_jump_transform = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, z_position)) 
                    .times(Mat4.scale(5, 0.8, 0.8)); // Scale the obstacle
            
                // Apply a 90-degree rotation about the y-axis
                obstacle_jump_transform = obstacle_jump_transform.times(Mat4.rotation(Math.PI/2, 0, 1, 0));
                this.shapes.obstacleJump.draw(context, program_state, obstacle_jump_transform, this.materials.obstacle);
            }
            
        }*/
            
    }
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
          
        }`;
    }
}

