import { defs, tiny } from './utils/common.js';
import { Shape_From_File } from './utils/helper.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class SkateboardingGame extends Scene {
    constructor() {
        super();
        // Shapes
        this.shapes = {
            // Existing shapes
            ...this.shapes,
            // Road
            road: new defs.Cube(),
            // Skateboarder
            // skateboarder: new defs.Subdivision_Sphere(4),
            skateboarder: new Shape_From_File("assets/objects/skateMan.obj"),
            dashed_line: new defs.Cube(),
            // Obstacles
            obstacleFence: new Shape_From_File("assets/objects/fence.obj"),
            obstacleBench: new Shape_From_File("assets/objects/bench_high_res.obj"),
            obstacleTrafficCone: new Shape_From_File("assets/objects/traffic_cone.obj"),
        };


        // Materials
        this.materials = {
            // Existing materials
            ...this.materials,
            // Road
            road: new Material(new defs.Textured_Phong(1), {ambient: .5, texture: new Texture("assets/textures/road_texture.png")}),
            dashed_line: new Material(new defs.Phong_Shader(),
                {ambient: 0.3, diffusivity: 0.6, color: hex_color("#FFFF00")}),
            // Skateboarder
            skateboarder: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#ffa500")}),
            // Obstacles
            obstacleFence: new Material(new defs.Textured_Phong(1), {ambient: .5, texture: new Texture("assets/textures/wood_fence.jpg")}),
            obstacleBench: new Material(new defs.Textured_Phong(1), {ambient: .8, texture: new Texture("assets/textures/wood_bench.png")}),
            obstacleTrafficCone: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#fc7819")}),
        };

        // Initial camera location
        this.initial_camera_location = Mat4.look_at(
            vec3(0, 10, 15), // eye position
            vec3(0, 0, -5), // at position
            vec3(0, 1, 0) // up direction
        );
        
        this.pos = 0;
        this.jump = 0;
        this.score = 0;

        ///////////////////////////// Obstacles /////////////////////////////////
        this.obstacles = [];
        this.xval = [];
        this.zval = [];
        this.obstacle_type = [];
        this.num_obstacles = 50;
        this.obstacle_initial = -150;
        this.obstacle_cutoff = 25;
        this.max_dist = 20;
        this.min_dist = 15;
        this.speed = 15;

        this.collision_threshold = 2;
        this.collision_detected = false;

        for (let i = 0; i < this.num_obstacles; i++) {
            // Generate random x value position (lateral)
            const obstacle_positions = [-2.5, 0, 2.5];
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
                    .times(Mat4.translation(this.xval[i], 2, initial_z));
            } else if (this.obstacle_type[i] === 2) {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, initial_z));
            } else {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, initial_z));
            }
        }
        //////////////////////////////////////////////////////////////////////////
    }

    update_score(dt) {
        // Increment the score based on time or other factors
        this.score += dt; // For example, increment score by the delta time
    }

    // Controls
    make_control_panel() {
        this.key_triggered_button("Left", ["q"], () => {
            if (!this.collision_detected && (this.pos === 0 || this.pos === 1)) {
                // Shift skateboarder to the left
                this.pos -= 1; // Update the position to move left
            }
        });
        this.key_triggered_button("Right", ["e"], () => {
            if (!this.collision_detected && (this.pos === -1 || this.pos === 0)) {
                // Shift skateboarder to the right 
                this.pos += 1; // Update the position to move right
            }
        });
        this.key_triggered_button("Jump", ["t"], () => {
            // Adjust skateboarder's position upwards for a jump
            if (!this.collision_detected) {
                this.jump = 1;
            }
        });
        this.key_triggered_button("Restart", ["g"], () => {
            // Restart the game
            this.restartGame();
        });
    }

    gameOver(score) {
        document.getElementById("game-over-screen").style.visibility = "visible";
        document.getElementById("score-container").style.visibility = "hidden";
        document.getElementById('final-score').textContent = 'Your Score: ' + score + 'm';
        this.materials.road.shader.uniforms.stop_texture_update = 1;
        this.speed = 0;

    }
    
    restartGame() {
        console.log("Resetting shader uniforms");
        document.getElementById("game-over-screen").style.visibility = "hidden";
        document.getElementById("score-container").style.visibility = "visible";
        this.pos = 0;
        this.jump = 0;
        this.score = 0;
        this.speed = 15;
        this.collision_detected = false;

        // Reset obstacles
        for (let i = 0; i < this.num_obstacles; i++) {
            // Generate random x value position (lateral)
            const obstacle_positions = [-2.5, 0, 2.5];
            const random_index = Math.floor(Math.random() * obstacle_positions.length);
            this.xval[i] = obstacle_positions[random_index];

            // Generate random z value position (depth)
            if (i == 0) {
                this.zval[0] = -80-Math.floor(Math.random() * (this.max_dist - this.min_dist) + this.min_dist);
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
                    .times(Mat4.translation(this.xval[i], 2, initial_z));
            } else if (this.obstacle_type[i] === 2) {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, initial_z));
            } else {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 2, initial_z));
            }
        }

        // Start texture update
        this.materials.road.shader.uniforms.stop_texture_update = 0;
        this.materials.road.shader.uniforms.texture_offset = 0;
        this.materials.road.shader.uniforms.animation_time = 0;
    }

    display(context, program_state) {
        // Setup program state
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // Setup lighting
        const light_position = vec4(0, 20, 20, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // Setup time variables
        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const dz = (dt * this.speed);

        // Make game speed up over time
        if (this.speed < 50 && !this.collision_detected && this.speed > 0){
            this.speed += 0.05;
            // this.materials.road.shader.uniforms.tex
            // In your game update function
            

        }
        this.materials.road.shader.uniforms.texture_offset += this.speed * dt/280; 

        // Update score
        if (!this.collision_detected) {
            this.update_score(dt * this.speed);
            document.getElementById("score-text").innerHTML = "Distance: " + Math.floor(this.score) + "m";
        }
        if (this.collision_detected) {
            this.gameOver(Math.floor(this.score));
            this.materials.road.shader.uniforms.stop_texture_update = 1; // Stop texture update
            this.speed = 0;
        }

        // Draw Road
        let road_transform = Mat4.identity().times(Mat4.scale(5, 1, 150));
        this.shapes.road.draw(context, program_state, road_transform, this.materials.road);

        // Create skater and jump motion
        let skateboarder_transform = Mat4.identity().times(Mat4.translation(2.5*this.pos, 2, 0));
        if (this.jump == 1) {
            const jump_duration = 0.75; 
            const jump_height_max = 3;
            const jump_height_min = 1;

            if (!("start_time" in this)) {
                // Record the start time if not already set
                this.start_time = t;
            }

            let jump_progress = Math.min(t - this.start_time, jump_duration);
            let jump_height_at_time = jump_height_min + (0.5*(jump_height_max-jump_height_min)) * Math.sin((Math.PI / jump_duration) * jump_progress);

            skateboarder_transform = Mat4.identity().times(Mat4.translation(2.5*this.pos, jump_height_at_time*2, 0));
            if (jump_progress >= jump_duration) {
                this.jump = 0;
                delete this.start_time;
            }
        }

        // Draw the skateboarder
        skateboarder_transform = skateboarder_transform.times(Mat4.translation(0, 1, 0)).times(Mat4.rotation(-Math.PI/2, 1, 0, 0)).times(Mat4.rotation(Math.PI/2, 0, 0, 1));
        this.shapes.skateboarder.draw(context, program_state, skateboarder_transform, this.materials.skateboarder);

        const skateboarder_position = skateboarder_transform.times(vec4(0, 0, 0, 1));
        for (let i = 0; i < this.num_obstacles; i++) {
            const obstacle_position = this.obstacles[i].times(vec4(0, 0, 0, 1));
            const distance = Math.sqrt(
                Math.pow(skateboarder_position[0] - obstacle_position[0], 2) +
                Math.pow(skateboarder_position[1] - obstacle_position[1], 2) +
                Math.pow(skateboarder_position[2] - obstacle_position[2], 2)
            );
            if (distance < this.collision_threshold) {
                console.log(`Collision with obstacle ${i} detected!`);
                this.collision_detected = true;
                this.materials.road.shader.uniforms.stop_texture_update = 1; // Stop texture update
                this.speed = 0;
                break;
            }
        }

        // Draw obstacles
        for (let i = 0; i < this.num_obstacles; i++ ) {
            this.obstacles[i] = this.obstacles[i].times(Mat4.translation(0, 0, dz));
            // Draw fence obstacle
            if (this.obstacle_type[i] === 0) {
                let transform = this.obstacles[i].times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.scale(0.8, 1.2, 1.2));
                this.shapes.obstacleFence.draw(context, program_state, transform, this.materials.obstacleFence);
            }
            // Draw traffic cone obstacle
            else if (this.obstacle_type[i] === 2) {
                let transform = this.obstacles[i].times(Mat4.scale(0.8, 0.8, 0.8));
                this.shapes.obstacleTrafficCone.draw(context, program_state, transform, this.materials.obstacleTrafficCone);
            } 
            // Draw bench obstacle
            else {
                let transform = this.obstacles[i].times(Mat4.scale(2.2, 1.2, 1.4));
                this.shapes.obstacleBench.draw(context, program_state, transform, this.materials.obstacleBench);
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
                        .times(Mat4.translation(x_pos, 2, this.obstacles[(i+this.num_obstacles-1)%this.num_obstacles][2][3]+dz-z_offset));
                } else if (this.obstacle_type[i] === 2) {
                    this.obstacles[i] = Mat4.identity()
                        .times(Mat4.translation(x_pos, 2, this.obstacles[(i+this.num_obstacles-1)%this.num_obstacles][2][3]+dz-z_offset));
                } else {
                    this.obstacles[i] = Mat4.identity()
                        .times(Mat4.translation(x_pos, 2, this.obstacles[(i+this.num_obstacles-1)%this.num_obstacles][2][3]+dz-z_offset));
                }
            }
        }
    }
}

class Gouraud_Shader extends Shader {
    
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

