// src/ui/background.js

export class SpatialBackground {
    constructor() {
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020617, 0.001);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
        this.camera.position.z = 1000;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Setup canvas styles to sit behind everything
        const canvas = this.renderer.domElement;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none'; // let clicks pass through
        document.body.appendChild(canvas);

        this.createParticles();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.animate();
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for ( let i = 0; i < 2000; i ++ ) {
            const x = 2000 * Math.random() - 1000;
            const y = 2000 * Math.random() - 1000;
            const z = 2000 * Math.random() - 1000;
            vertices.push( x, y, z );
        }

        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

        // Create a circular texture programmatically
        const canvas = document.createElement('canvas');
        canvas.width = 16; canvas.height = 16;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(167, 139, 250, 1)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 16);
        const texture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial( { size: 10, map: texture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false } );

        this.particles = new THREE.Points( geometry, material );
        this.scene.add( this.particles );
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    animate() {
        requestAnimationFrame( this.animate.bind(this) );
        this.render();
    }

    render() {
        const time = Date.now() * 0.00005;
        this.camera.position.x += ( 0 - this.camera.position.x ) * 0.05;
        this.camera.position.y += ( 0 - this.camera.position.y ) * 0.05;
        this.camera.lookAt( this.scene.position );

        const h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
        this.particles.material.color.setHSL( h, 0.5, 0.5 );
        this.particles.rotation.y = time * 0.5;

        this.renderer.render( this.scene, this.camera );
    }
}
