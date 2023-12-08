import { defs, tiny } from './utils/common.js';
import { Shape_From_File } from './utils/helper.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

class Skateboard extends Shape {
    constructor() {
        super("position", "normal", "texture_coord");
        // Main body of the skateboard
        this.body = new defs.Cube();

        // Rounded edges (using spheres)
        this.edge1 = new defs.Subdivision_Sphere(4);
        this.edge2 = new defs.Subdivision_Sphere(4);

        // Wheels (using spheres)
        this.wheel = new defs.Subdivision_Sphere(4);
    }

    draw(context, program_state, model_transform, material_board, material_wheels) {
        // Adjust these values based on the size of your skateboard
        let length = 1.25, width = 0.03, height = 0.35;

        // Draw the main body
        let body_transform = model_transform.times(Mat4.scale(length, width, height));
        this.body.draw(context, program_state, body_transform, material_board);

        // Draw the rounded edges
        let edge_transform = model_transform.times(Mat4.translation(length, 0, 0))
                                            .times(Mat4.scale(height, width, height));
        this.edge1.draw(context, program_state, edge_transform, material_board);

        edge_transform = model_transform.times(Mat4.translation(-length, 0, 0))
                                         .times(Mat4.scale(height, width, height));
        this.edge2.draw(context, program_state, edge_transform, material_board);

        let wheel_radius = 0.1;
        let wheel_thickness = 0.06;
        let wheel_transform;

        wheel_transform = model_transform.times(Mat4.translation(1, -0.1, 0.3))
                                .times(Mat4.scale(wheel_radius, wheel_radius, wheel_thickness));
        this.wheel.draw(context, program_state, wheel_transform, material_wheels);

        wheel_transform = model_transform.times(Mat4.translation(1, -0.1, -0.3))
                                .times(Mat4.scale(wheel_radius, wheel_radius, wheel_thickness));
        this.wheel.draw(context, program_state, wheel_transform, material_wheels);

        wheel_transform = model_transform.times(Mat4.translation(-1, -0.1, 0.3))
                                .times(Mat4.scale(wheel_radius, wheel_radius, wheel_thickness));
        this.wheel.draw(context, program_state, wheel_transform, material_wheels);

        wheel_transform = model_transform.times(Mat4.translation(-1, -0.1, -0.3))
                                .times(Mat4.scale(wheel_radius, wheel_radius, wheel_thickness));
        this.wheel.draw(context, program_state, wheel_transform, material_wheels);
    }
}


export class SkateboardingGame extends Scene {
    constructor() {
        super();
        // Shapes
        this.shapes = {
            // Existing shapes
            ...this.shapes,
            // Road and sidewalk
            road: new defs.Cube(),
            sidewalk: new defs.Cube(),
            dashed_line: new defs.Cube(),
            // Obstacles
            obstacleFence: new Shape_From_File("assets/objects/fence.obj"),
            obstacleBench: new Shape_From_File("assets/objects/bench_high_res.obj"),
            obstacleTrafficCone: new Shape_From_File("assets/objects/traffic_cone.obj"),
            obstacleBus: new Shape_From_File("assets/objects/bus.obj"),
            building: new defs.Cube(),
            sun: new defs.Subdivision_Sphere(4),
        };

        this.human_shapes = {
            head: new defs.Subdivision_Sphere(4),
            body: new defs.Rounded_Capped_Cylinder(4, 10),
            arm: new defs.Capped_Cylinder(4, 10),
            upper_leg: new defs.Capped_Cylinder(4, 10), // for the thigh
            lower_leg: new defs.Capped_Cylinder(4, 10), // for the calf
            hand: new defs.Subdivision_Sphere(2),
            foot: new defs.Subdivision_Sphere(2),
            police_hat: new defs.Subdivision_Sphere(4),
            skateboard: new Skateboard(),
        };

        this.human_materials = {
            skin: new Material(new defs.Phong_Shader(), {ambient: 0.3, color: hex_color("#FDD5B1")}),
            hands: new Material(new defs.Phong_Shader(), {ambient: 0.3, color: hex_color("#F3C79A")}),
            player_cloth: new Material(new defs.Phong_Shader(), {ambient: 0.3, color: hex_color("#C51E3A")}),
            police_cloth: new Material(new defs.Phong_Shader(), {ambient: 0.3, color: hex_color("#135DD8")}),
            shoes: new Material(new defs.Textured_Phong(1), {ambient: .5, diffusivity: 0.2, specularity: 0.3, texture: new Texture("assets/textures/shoe_texture.png")}),
            skateboard: new Material(new defs.Textured_Phong(1), {ambient: .1, diffusivity: 0.1, 
                specularity: 0.3, texture: new Texture("assets/textures/skateboard_texture.png")}),
            wheels: new Material(new defs.Phong_Shader(), {ambient: 0.3, color: hex_color("#A9A9A9")}),
        };

        this.draw_human_figure = function(context, program_state, model_transform, bend_angle=0, wave_hands=false, wave_angle=0, is_police=false) {  
            // Determine which cloth to use
            let cloth_material = this.human_materials.player_cloth;
            if (is_police) {
                cloth_material = this.human_materials.police_cloth;
            }
            
            // Calculate the angles for the human figure
            let back_bend_angle = bend_angle/2;
            let upper_leg_bend_angle = bend_angle;
            let lower_leg_bend_angle = -1 * bend_angle;
            
            // Base transform for the entire human figure
            let base_transform = model_transform.times(Mat4.translation(0, 0.5, 0)).times(Mat4.rotation(-back_bend_angle, 1, 0, 0))
                
            // Draw head
            let head_transform = base_transform.times(Mat4.translation(0, 0.85, 0))
                                        .times(Mat4.scale(0.3, 0.3, 0.3));
            this.human_shapes.head.draw(context, program_state, head_transform, this.human_materials.skin);

            // Draw police hat
            if (is_police) {
                let hat_transform = base_transform.times(Mat4.translation(0, 1.1, 0))
                                            .times(Mat4.scale(0.25, 0.25, 0.25));
                this.human_shapes.police_hat.draw(context, program_state, hat_transform, this.human_materials.police_cloth);
            }
            
            // Draw body
            let body_transform = model_transform.times(Mat4.translation(0, 0.5, 0))
                                        .times(Mat4.rotation(-back_bend_angle, 1, 0, 0))
                                        .times(Mat4.scale(0.5, 0.6, 0.4));
            this.human_shapes.body.draw(context, program_state, body_transform, cloth_material);

            if (wave_hands) {
                let hand_wave_transform = model_transform.times(Mat4.translation(0.45, 0.5, 0.02))
                                            .times(Mat4.rotation(Math.PI/7, 0, 1, 1))
                                            .times(Mat4.translation(0, .3, 0))
                                            .times(Mat4.rotation(wave_angle - 1.5, 1, 0, 0))
                                            .times(Mat4.translation(0, -.3, 0))
                                            .times(Mat4.scale(0.1, 0.4, 0.15));
                this.human_shapes.arm.draw(context, program_state, hand_wave_transform, this.human_materials.skin);
                hand_wave_transform = hand_wave_transform.times(Mat4.translation(0, -1, 0))
                                            .times(Mat4.scale(1, 0.25, 0.8));
                this.human_shapes.hand.draw(context, program_state, hand_wave_transform, this.human_materials.hands);
                

                hand_wave_transform = model_transform.times(Mat4.translation(-0.45, 0.5, 0.02))
                                            .times(Mat4.rotation(Math.PI/7, 0, -1, -1))
                                            .times(Mat4.translation(0, .3, 0))
                                            .times(Mat4.rotation(wave_angle - 1.5, 1, 0, 0))
                                            .times(Mat4.translation(0, -.3, 0))
                                            .times(Mat4.scale(0.1, 0.4, 0.15));
                this.human_shapes.arm.draw(context, program_state, hand_wave_transform, this.human_materials.skin);
                hand_wave_transform = hand_wave_transform.times(Mat4.translation(0, -1, 0))
                                            .times(Mat4.scale(1, 0.25, 0.8));
                this.human_shapes.hand.draw(context, program_state, hand_wave_transform, this.human_materials.hands);
            } else {
                // Draw right arm and hand
                let arm_transform = base_transform.times(Mat4.translation(0.45, 0, 0.02))
                                            .times(Mat4.rotation(Math.PI/7, 0, 1, 1))
                                            .times(Mat4.scale(0.1, 0.4, 0.15));
                this.human_shapes.arm.draw(context, program_state, arm_transform, this.human_materials.skin);

                let hand_transform = arm_transform.times(Mat4.translation(0, -1, 0))
                                            .times(Mat4.scale(1, 0.25, .8));
                this.human_shapes.hand.draw(context, program_state, hand_transform, this.human_materials.hands);

                // Draw left arm and hand
                arm_transform = base_transform.times(Mat4.translation(-0.45, 0, 0.02))
                                            .times(Mat4.rotation(Math.PI/7, 0, 1, -1))
                                            .times(Mat4.scale(0.1, 0.4, 0.15));
                this.human_shapes.arm.draw(context, program_state, arm_transform, this.human_materials.skin);

                hand_transform = arm_transform.times(Mat4.translation(0, -1, 0))
                                            .times(Mat4.scale(1, 0.25, 0.8));
                this.human_shapes.hand.draw(context, program_state, hand_transform, this.human_materials.hands);
            }

            // Draw right upper and lower leg and foot
            let right_leg_transform = model_transform.times(Mat4.translation(0.2, -0.1, 0)).times(Mat4.scale(0.1, 0.25, 0.15));
            
            let upper_leg_transform = right_leg_transform.times(Mat4.rotation(upper_leg_bend_angle, 1, 0, 0));
            this.human_shapes.upper_leg.draw(context, program_state, upper_leg_transform, this.human_materials.skin);

            let lower_leg_transform = right_leg_transform.times(Mat4.translation(0, -0.7, 0)).times(Mat4.rotation(lower_leg_bend_angle, 1, 0, 0)).times(Mat4.translation(0, -0.3, 0)).times(Mat4.scale(1, 1, 1));
            this.human_shapes.lower_leg.draw(context, program_state, lower_leg_transform, this.human_materials.skin);

            // Draw left upper and lower leg and foot
            let left_leg_transform = model_transform.times(Mat4.translation(-0.2, -0.1, 0)).times(Mat4.scale(0.1, 0.25, 0.15));
            upper_leg_transform = left_leg_transform.times(Mat4.rotation(upper_leg_bend_angle, 1, 0, 0));
            this.human_shapes.upper_leg.draw(context, program_state, upper_leg_transform, this.human_materials.skin);

            lower_leg_transform = left_leg_transform.times(Mat4.translation(0, -0.7, 0)).times(Mat4.rotation(lower_leg_bend_angle, 1, 0, 0)).times(Mat4.translation(0, -0.3, 0)).times(Mat4.scale(1, 1, 1));
            this.human_shapes.lower_leg.draw(context, program_state, lower_leg_transform, this.human_materials.skin);

            // Draw feet
            let foot_transform = model_transform.times(Mat4.translation(0.2, -0.55, -0.05 + 0.1 * bend_angle)).times(Mat4.scale(0.12, 0.12, 0.2));
            this.human_shapes.foot.draw(context, program_state, foot_transform, this.human_materials.shoes);

            foot_transform = model_transform.times(Mat4.translation(-0.2, -0.55, -0.05 + 0.1 * bend_angle)).times(Mat4.scale(0.12, 0.12, 0.2));
            this.human_shapes.foot.draw(context, program_state, foot_transform, this.human_materials.shoes);

            // Draw skateboard under the feet
            if (!is_police) {
                let skateboard_transform = model_transform.times(Mat4.translation(0, -0.65, -0.05));
                this.human_shapes.skateboard.draw(context, program_state, skateboard_transform, this.human_materials.skateboard, this.human_materials.wheels);
            }
        };

        // Materials
        this.materials = {
            // Existing materials
            ...this.materials,
            // Road
            road: new Material(new defs.Textured_Phong(1), {ambient: .5, texture: new Texture("assets/textures/road_texture.png")}),
            sidewalk: new Material(new defs.Textured_Phong(1), {ambient: .8, texture: new Texture("assets/textures/sidewalk.jpg")}),
            // Obstacles
            obstacleFence: new Material(new defs.Textured_Phong(1), {ambient: .7, diffusivity: 0.2,
                specularity: 0.3, texture: new Texture("assets/textures/wood_bench.png")}),
            obstacleBench: new Material(new defs.Textured_Phong(1), {ambient: .8, diffusivity: 0,
                specularity: 0.5, texture: new Texture("assets/textures/wood_fence.jpg")}),
            obstacleTrafficCone: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#fc7819")}),
            obstacleBus: new Material(new defs.Textured_Phong(), {ambient: .7, diffusivity: 0.6}),
            buildingOffice: new Material(new defs.Textured_Phong(1), {ambient: .8, 
                texture: new Texture("assets/textures/office.png")}),
            building1: new Material(new defs.Textured_Phong(1), {ambient: .8, 
                texture: new Texture("assets/textures/building1.jpg")}),
            building2: new Material(new defs.Textured_Phong(1), {ambient: .8, 
                texture: new Texture("assets/textures/building2.jpg")}),
            building3: new Material(new defs.Textured_Phong(1), {ambient: .8, 
                texture: new Texture("assets/textures/building3.jpg")}),
            sun: new Material(new defs.Phong_Shader(),
                {color: hex_color("#FFFF00"), ambient: 1, diffusivity: 0, specularity: 0}),
        };

        // Initial camera location
        this.initial_camera_location = Mat4.look_at(
            vec3(0, 9, 15), // eye position
            vec3(0, 0, -5), // at position
            vec3(0, 1, 0) // up direction
        );
        
        this.pos = 0;
        this.jump = 0;
        this.score = 0; 
        this.bend_angle = 0;       
        this.left = 0;
        this.right = 0;

        ///////////////////////////// Obstacles /////////////////////////////////
        this.obstacles = [];
        this.xval = [];
        this.zval = [];
        this.obstacle_type = [];
        this.num_obstacles = 50;
        this.obstacle_initial = -150;
        this.obstacle_cutoff = 25;
        this.max_dist = 15;
        this.min_dist = 10;
        this.speed = 15;

        this.collision_threshold = 2.5;
        this.collision_detected = false;
        this.backgroundMusic = document.getElementById('background-music');
        this.backgroundMusic.volume = 0.4;
        this.backgroundMusic.loop = true;


        for (let i = 0; i < this.num_obstacles; i++) {
            // Generate random x value position (lateral)
            const obstacle_positions = [4, 0, 4];
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
            if (random_number < 0.25) {
                this.obstacle_type[i] = 1; // Set as jump obstacle
            } else if (random_number >= 0.25 && random_number < .65) {
                this.obstacle_type[i] = 2; // Set as cone obstacle
            } else {
                this.obstacle_type[i] = 0; // Set as regular obstacle
            }

            let initial_z = this.zval[i];

            // Initialize obstacle transform based on the obstacle type
            if (this.obstacle_type[i] === 0) {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 1.5, initial_z));
            } else if (this.obstacle_type[i] === 2) {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 1.5, initial_z));
            } else {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 1.5, initial_z));
            }
        }
        //////////////////////////////////////////////////////////////////////////

        ///////////////////////////// Buildings //////////////////////////////////
        this.buildings_l = [];
        this.buildings_r = [];
        this.build_zval = [];
        this.build_type = [];
        this.num_buildings = 50;
        this.building_initial = -150;
        this.building_cutoff = 2;
        this.building_r_type = [];
        this.building_l_type = [];


        for (let i = 0; i < this.num_buildings; i++) {
            // Position buildings equidistant from next building
            this.buildings_l[i] = Mat4.identity().times(Mat4.scale(5, 5, 6)).times(Mat4.translation(-3.7, 1.2, -2-2.1*i));
            this.buildings_r[i] = Mat4.identity().times(Mat4.scale(5, 5, 6)).times(Mat4.translation(3.7, 1.2, -2-2.1*i));

            // Generate random building type right side
            const random_number = Math.random();
            if (random_number < 0.25) {
                this.building_r_type[i] = 0; // Set as office
            } else if (random_number >= 0.25 && random_number < .50) {
                this.building_r_type[i] = 1; // Set as building 1
            } else if (random_number >= .50 && random_number < .75) {
                this.building_r_type[i] = 2; // Set as building 2
            } else {
                this.building_r_type[i] = 3; // Set as building 3
            }

            // Generate random building type left side
            const random_number2 = Math.random();
            if (random_number2 < 0.25) {
                this.building_l_type[i] = 0; // Set as office
            } else if (random_number2 >= 0.25 && random_number2 < .50) {
                this.building_l_type[i] = 1; // Set as building 1
            } else if (random_number2 >= .50 && random_number2 < .75) {
                this.building_l_type[i] = 2; // Set as building 2
            } else {
                this.building_l_type[i] = 3; // Set as building 3
            }
            //////////////////////////////////////////////////////////////////////////
        }

        this.police_position = Mat4.identity().times(Mat4.translation(0, 2, -20)).times(Mat4.scale(1.5, 1.5, 1.5));
        this.t = 0;
        this.dt = 0;
        this.gt = 0;
        this.gdt = 0;
        this.restartGameTime = 0;

    }

    update_score(gdt) {
        // Increment the score based on time or other factors
        this.score += gdt; // For example, increment score by the delta time
    }

    // Controls
    make_control_panel() {
        this.key_triggered_button("Left", ["q"], () => {
            if (!this.collision_detected && (this.pos === 0 || this.pos === 1) && this.gt !== 0) {
                // Shift skateboarder to the left
                this.pos -= 1; // Update the position to move left
                this.left = 1;
            }
        });
        this.key_triggered_button("Right", ["e"], () => {
            if (!this.collision_detected && (this.pos === -1 || this.pos === 0) && this.gt !== 0) {
                // Shift skateboarder to the right 
                this.pos += 1; // Update the position to move right
                this.right = 1;
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
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        this.backgroundMusic.play();

        // Reset obstacles
        for (let i = 0; i < this.num_obstacles; i++) {
            // Generate random x value position (lateral)
            const obstacle_positions = [-4, 0, 4];
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
                    .times(Mat4.translation(this.xval[i], 1.5, initial_z));
            } else if (this.obstacle_type[i] === 2) {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 1.5, initial_z));
            } else {
                this.obstacles[i] = Mat4.identity()
                    .times(Mat4.translation(this.xval[i], 1.5, initial_z));
            }
        }

        this.police_position = Mat4.identity().times(Mat4.translation(0, 2, -20)).times(Mat4.scale(1.5, 1.5, 1.5));

        // Start texture update
        this.materials.road.shader.uniforms.stop_texture_update = 0;
        this.materials.road.shader.uniforms.texture_offset = 0;
        this.materials.road.shader.uniforms.animation_time = 0;

        // Used within display to keep the pause before the game begins
        this.restartGameTime = this.t;
    }

    display(context, program_state) {
        this.backgroundMusic.play();
        // Setup program state
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // Setup lighting
        let sun_position = vec4(5, 30, 30, 0);
        program_state.lights = [new Light(sun_position, color(0.94, 0.94, 0.70, 1), 3000)];
        
        // Sun light
        let sun_transform = Mat4.translation(sun_position).times(Mat4.scale(5, 5, 5));
        this.shapes.sun.draw(context, program_state, sun_transform, this.materials.sun);


        this.t = program_state.animation_time / 1000, this.dt = program_state.animation_delta_time / 1000;


        // Adds a 2 second pause before movement begins, to add yelling policeman voice
        if (this.restartGameTime > 0) {
            if (this.t - this.restartGameTime < 2) {
                this.gt = 0;
                this.gdt = 0;
            } else {
                this.gt = this.t - this.restartGameTime - 2;
                this.gdt = this.dt;
            }
        } else {
            if (this.t < 4) {
                this.gt = 0;
                this.gdt = 0;
            } else {
                this.gt = this.t - 4;
                this.gdt = this.dt;
            }
        }
        
        const dz = (this.gdt * this.speed);

        // Make game speed up over time
        if (this.speed < 50 && !this.collision_detected && this.speed > 0 && this.gdt !== 0){
            this.speed += 0.05;
        }
        this.materials.road.shader.uniforms.texture_offset += this.speed * this.gdt/450;
        this.materials.sidewalk.shader.uniforms.texture_offset += 20*this.speed * this.gdt/450;

        // Update score
        if (!this.collision_detected) {
            this.update_score(this.gdt * this.speed);
            document.getElementById("score-text").innerHTML = "Distance: " + Math.floor(this.score) + "m";
        }
        if (this.collision_detected) {
            this.gameOver(Math.floor(this.score));
            this.materials.road.shader.uniforms.stop_texture_update = 1; // Stop texture update
            this.speed = 0;
        }

        // Draw Road
        let road_transform = Mat4.identity().times(Mat4.scale(7, 1, 250));
        this.shapes.road.draw(context, program_state, road_transform, this.materials.road);

        // Draw sidewalk
        let sidewalk_transform_l = Mat4.identity().times(Mat4.scale(4, 1, 10)).times(Mat4.translation(-2.8, 0, 0));
        let sidewalk_transform_r = Mat4.identity().times(Mat4.scale(4, 1, 10)).times(Mat4.translation(2.8, 0, 0));
        for (let i = 0; i < 13; i++)
        {
            this.shapes.sidewalk.draw(context, program_state, sidewalk_transform_l, this.materials.sidewalk);
            this.shapes.sidewalk.draw(context, program_state, sidewalk_transform_r, this.materials.sidewalk);
            sidewalk_transform_l = sidewalk_transform_l.times(Mat4.translation(0, 0, -2));
            sidewalk_transform_r = sidewalk_transform_r.times(Mat4.translation(0, 0, -2));
        }

        // Draw buildings left side
        for (let i = 0; i < this.num_buildings; i++ ) {
            this.buildings_l[i] = this.buildings_l[i].times(Mat4.scale(1, 1, 1/6));
            this.buildings_l[i] = this.buildings_l[i].times(Mat4.translation(0, 0, dz));
            this.buildings_l[i] = this.buildings_l[i].times(Mat4.scale(1,1,6));
            // Draw office
            if (this.building_l_type[i] === 0) {
                this.shapes.building.draw(context, program_state, this.buildings_l[i], this.materials.buildingOffice);
            }
            // Draw building 1
            else if (this.building_l_type[i] === 1) {
                this.shapes.building.draw(context, program_state, this.buildings_l[i], this.materials.building1);
            } 
            // Draw building 2
            else if (this.building_l_type[i] === 2) {
                this.shapes.building.draw(context, program_state, this.buildings_l[i], this.materials.building2);
            }
            // Draw building 3
            else {
                this.shapes.building.draw(context, program_state, this.buildings_l[i], this.materials.building3);
            }

            // Initialize building transform based on the building type if passed threshold
            if (this.buildings_l[i][2][3] > this.building_cutoff) {                
                
                // Generate random building type left side
                const random_number2 = Math.random();
                if (random_number2 < 0.25) {
                    this.building_l_type[i] = 0; // Set as office
                } else if (random_number2 >= 0.25 && random_number2 < .50) {
                    this.building_l_type[i] = 1; // Set as building 1
                } else if (random_number2 >= .50 && random_number2 < .75) {
                    this.building_l_type[i] = 2; // Set as building 2
                } else {
                    this.building_l_type[i] = 3; // Set as building 3
                }

                // Position building at back of line
                this.buildings_l[i] = Mat4.identity().times(Mat4.scale(5, 5, 6)).times(Mat4.translation(-3.7, 1.2, -2.1))
                this.buildings_l[i] = this.buildings_l[i].times(Mat4.scale(1, 1, 1/6));
                this.buildings_l[i] = this.buildings_l[i].times(Mat4.translation(0, 0, this.buildings_l[(i+this.num_buildings-1)%this.num_buildings][2][3]+dz));
                this.buildings_l[i] = this.buildings_l[i].times(Mat4.scale(1,1,6));
            }
        }

        // Draw buildings right side
        for (let i = 0; i < this.num_buildings; i++ ) {
            this.buildings_r[i] = this.buildings_r[i].times(Mat4.scale(1,1,1/6));
            this.buildings_r[i] = this.buildings_r[i].times(Mat4.translation(0, 0, dz));
            this.buildings_r[i] = this.buildings_r[i].times(Mat4.scale(1,1,6));

            // Draw office
            if (this.building_r_type[i] === 0) {
                this.shapes.building.draw(context, program_state, this.buildings_r[i], this.materials.buildingOffice);
            }
            // Draw building 1
            else if (this.building_r_type[i] === 1) {
                this.shapes.building.draw(context, program_state, this.buildings_r[i], this.materials.building1);
            } 
            // Draw building 2
            else if (this.building_r_type[i] === 2) {
                this.shapes.building.draw(context, program_state, this.buildings_r[i], this.materials.building2);
            }
            // Draw building 3
            else {
                this.shapes.building.draw(context, program_state, this.buildings_r[i], this.materials.building3);
            }

            // Initialize building transform based on the building type if passed threshold
            if (this.buildings_r[i][2][3] > this.building_cutoff) {                
                
                // Generate random building type left side
                const random_number2 = Math.random();
                if (random_number2 < 0.25) {
                    this.building_r_type[i] = 0; // Set as office
                } else if (random_number2 >= 0.25 && random_number2 < .50) {
                    this.building_r_type[i] = 1; // Set as building 1
                } else if (random_number2 >= .50 && random_number2 < .75) {
                    this.building_r_type[i] = 2; // Set as building 2
                } else {
                    this.building_r_type[i] = 3; // Set as building 3
                } 

                // Position building at back of line
                this.buildings_r[i] = Mat4.identity().times(Mat4.scale(5, 5, 6)).times(Mat4.translation(3.7, 1.2, -2.1))
                this.buildings_r[i] = this.buildings_r[i].times(Mat4.scale(1, 1, 1/6));
                this.buildings_r[i] = this.buildings_r[i].times(Mat4.translation(0, 0, this.buildings_r[(i+this.num_buildings-1)%this.num_buildings][2][3]+dz));
                this.buildings_r[i] = this.buildings_r[i].times(Mat4.scale(1,1,6));
            }
        }
        

        // Create skater and jump motion
        let skateboarder_transform = Mat4.identity().times(Mat4.translation(4*this.pos, 2.25, 0)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.scale(1.5, 1.5, 1.5));
        if (this.jump == 1) {
            const jump_duration = 0.8; 
            const bend_duration = jump_duration / 5; 
            const jump_height_max = 4;
            const jump_height_min = 1;

            if (!("start_time" in this)) {
                this.start_time = this.gt;
            }

            let jump_progress = Math.min(this.gt - this.start_time, jump_duration);

            let jump_height_at_time = 0;

            if (jump_progress < bend_duration) {
                this.bend_angle = 0.5 * Math.sin((Math.PI / bend_duration) * jump_progress);
                skateboarder_transform = Mat4.identity().times(Mat4.translation(4*this.pos, 2.25, 0)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.scale(1.5, 1.5, 1.5));
            }
            else {
                jump_height_at_time = jump_height_min + (0.5*(jump_height_max-jump_height_min)) * Math.sin((Math.PI / jump_duration) * jump_progress);
                this.bend_angle = 0;
                skateboarder_transform = Mat4.identity().times(Mat4.translation(4*this.pos, jump_height_at_time*2.25, 0)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.scale(1.5, 1.5, 1.5));
            }

            

            if (jump_progress >= jump_duration) {
                this.jump = 0;
                delete this.start_time;
            }
            console.log(this.bend_angle);
        }

        if (this.left == 1) {
            const left_duration = 0.3; 

            if (!("start_time" in this)) {
                this.start_time = this.gt;
            }

            let left_progress = Math.min(this.gt - this.start_time, left_duration);


            if (left_progress < left_duration) {
                skateboarder_transform = Mat4.identity().times(Mat4.translation(4*this.pos, 2.25, 0)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.rotation(-Math.PI/20, 1, 0, 0)).times(Mat4.scale(1.5, 1.5, 1.5));
            }
            else {
                this.left = 0;
                delete this.start_time;
            }
        }

        if (this.right == 1) {
            const right_duration = 0.3; 

            if (!("start_time" in this)) {
                this.start_time = this.gt;
            }

            let right_progress = Math.min(this.gt - this.start_time, right_duration);


            if (right_progress < right_duration) {
                skateboarder_transform = Mat4.identity().times(Mat4.translation(4*this.pos, 2.25, 0)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.rotation(Math.PI/20, 1, 0, 0)).times(Mat4.scale(1.5, 1.5, 1.5));
            }
            else {
                this.right = 0;
                delete this.start_time;
            }
        }

        this.draw_human_figure(context, program_state, skateboarder_transform, this.bend_angle);

        const skateboarder_position = skateboarder_transform.times(vec4(0, 0, 0, 1));
        for (let i = 0; i < this.num_obstacles; i++) {
            const obstacle_position = this.obstacles[i].times(vec4(0, 0, 0, 1));
            const distance = Math.sqrt(
                Math.pow(skateboarder_position[0] - obstacle_position[0], 2) +
                Math.pow(skateboarder_position[1] - obstacle_position[1], 2) +
                Math.pow(skateboarder_position[2] - obstacle_position[2], 2)
            );
            if (distance < this.collision_threshold) {
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
                let transform = this.obstacles[i].times(Mat4.scale(1, 1, 1));
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
                const obstacle_positions = [-4, 0, 4];
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
        this.police_position = this.police_position.times(Mat4.translation(0, 0, dz));
        let wave_angle = Math.sin(this.t * 2 * Math.PI);
        this.draw_human_figure(context, program_state, this.police_position, 0, true, wave_angle, true);

        const polPos = this.police_position.times(vec4(0, 0, 0, 1));
        const distance_to_police = Math.sqrt(
            Math.pow(skateboarder_position[0] - polPos[0], 2) +
            Math.pow(skateboarder_position[1] - polPos[1], 2) +
            Math.pow(skateboarder_position[2] - polPos[2], 2)
        );
        
        // Check for collision
        if (distance_to_police < this.collision_threshold) {
            this.collision_detected = true;
            this.materials.road.shader.uniforms.stop_texture_update = 1; // Stop texture update
            this.speed = 0;
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

