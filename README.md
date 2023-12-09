# Project Report: Skate Escape

## Team Members

### Andres Cruz
- **Email**: acruz0426@ucla.edu
- **Student ID**: 305303627
- **Contributions**:
  - Obstacle spawning and randomization.
  - Building texture creation and spawning.
  - Light post creation and spawning.
  - Sidewalk creation and texturing.
  - Modification of obstacle models.
  - and more...

### Varun Kumar
- **Email**: vvkumar1@ucla.edu
- **Student ID**: 805780536
- **Contributions**:
  - Development of road texture and movement.
  - Initial obstacle setup.
  - Creation of skater and skateboarder models.
  - Implementation of jumping skater animation.
  - Adding left/right movement and jumping ability to the skater.
  - Designing obstacle models.
  - and more...

### Abhishek Karnik
- **Email**: abhishekkarnik@ucla.edu
- **Student ID**: 906072449
- **Contributions**:
  - Collision detection algorithms.
  - Lateral movement and jumping mechanics.
  - Initial obstacle placement.
  - Implementing skater tilt during side-to-side movements.
  - Integration of police and skater models with game pause feature at the beginning.
  - and more...

## Project Overview

### Goal
Skate Escape is a thrilling 3D adventure set in a vibrant urban landscape. Players assume the role of a daring skateboarder who must navigate through a city while being chased by a police officer. The game's goal is to evade capture, dodge obstacles, and survive as long as possible in a dynamic environment that tests reflexes and agility.

### Features
- **Dynamic Obstacle Avoidance**: Players must skillfully navigate around various obstacles, including barricades, stacks of tires, and traffic cones, each offering unique challenges.
- **Progressive Difficulty**: The game's pace intensifies over time, requiring players to adapt quickly to the increasing speed and more frequent obstacles.
- **Detailed Environment**: The game world features richly textured surfaces, including roads, sidewalks, and buildings, enhancing the player's immersion.
- **Advanced Shading**: Utilizing shading techniques like Phong, Gouraud, and Flat shading, the game achieves a realistic and visually appealing look.
- **Realistic Lighting Effects**: The game implements dynamic lighting, highlighting specular and ambient effects to enhance realism.
- **Efficient Rendering**: The game optimizes performance by rendering only visible objects, repurposing objects outside the player’s view.
- **Randomized Obstacle Placement**: Obstacles appear randomly, ensuring each game session offers a new experience.
- **Diverse Building Textures**: Players will encounter buildings with four different textures, adding variety to the urban landscape.
- **Custom Human Model**: A meticulously designed skater and cop model allows for detailed animations, especially during jumps and maneuvers.

### Collision Detection (Advanced Feature)
- The game incorporates a sophisticated collision detection system to determine interactions between the skater, obstacles, and the pursuing police officer. It first calculates the distance between the skater and the obstacles. If the distance is less than a certain threshold, it is determined to be a collision. 

## Operation and Controls
- **Movement**: Press ‘Q’ to move left and ‘E’ to move right, enabling players to dodge obstacles.
- **Jump**: Press ‘T’ to perform a jump, crucial for avoiding certain obstacles.
- **Restart**: Press ‘G’ to restart the game, which is especially useful after a collision or to start a new game.

## Scoring and Levels
- **Scoring**: Points are awarded based on the distance traveled without colliding. This encourages players to focus on agility and quick reflexes.
- **Difficulty Levels**: The game progressively becomes more challenging with speed increases.

## Sound Effects
- **Engaging Audio**: The game features an adrenaline-pumping soundtrack that complements the fast-paced nature of the gameplay.

## Challenges
- **Object Management**: A significant challenge was managing the game's objects efficiently to ensure smooth gameplay without performance issues.
- **Collision Detection**: Implementing a reliable collision detection system was critical for the gameplay but posed technical difficulties.
- **Animation Realism**: Creating a realistic jumping animation for the skater model was a complex task that required detailed attention to physics and human movement.

## Conclusion
Skate Escape is not just a game; it's an exhilarating experience that combines fast-paced gameplay, advanced graphics, and physics. It's designed to challenge players with rapid decision-making and adaptability in an ever-changing urban environment. Each playthrough promises a unique experience, making Skate Escape a game that players will return to time and again.
