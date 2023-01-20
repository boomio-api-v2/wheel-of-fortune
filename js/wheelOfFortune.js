const cssRules = `
#wheelOfFortune {
    display: inline-flex;
    position: relative;
    overflow: hidden;
}

#wheel {
    display: block;
}

#spin {
    font: 1.5rem/0 sans-serif;
    user-select: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 30%;
    height: 30%;
    margin: -15%;
    background: #fff;
    color: #fff;
    box-shadow: 0 0 0 8px currentColor, 0 0px 15px 5px rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    transition: 0.8s;
}

#spin::after {
    content: "";
    position: absolute;
    top: -17px;
    border: 10px solid transparent;
    border-bottom-color: currentColor;
    border-top: none;
}
`;

const addStyles = () => {
    const style = document.createElement('style');
    style.setAttribute('id', 'boomio--stylesheet');
    document.getElementsByTagName('head')[0].appendChild(style);
    if (style.styleSheet) {
        style.styleSheet.cssText = cssRules;
    } else {
        style.appendChild(document.createTextNode(cssRules));
    }
}

const sectors = [
    {
        color:"#f82",
        label:"10",
        img:"https://eucys.eu/wp-content/uploads/2019/09/ribbon_prize-300x300.png",
    },
    {
        color:"#0bf",
        label:"10",
        img:"https://eucys.eu/wp-content/uploads/2019/09/ribbon_prize-300x300.png",
    },
    {
        color:"#fb0",
        label:"200",
        img:"https://eucys.eu/wp-content/uploads/2019/09/ribbon_prize-300x300.png",
    },
    {
        color:"#0fb",
        label:"50",
        img:"https://eucys.eu/wp-content/uploads/2019/09/ribbon_prize-300x300.png",
    },
    {
        color:"#b0f",
        label:"100",
        img:"https://eucys.eu/wp-content/uploads/2019/09/ribbon_prize-300x300.png",
    },
    {
        color:"#f0b",
        label:"5",
        img:"https://eucys.eu/wp-content/uploads/2019/09/ribbon_prize-300x300.png",
    },
    {
        color:"#bf0",
        label:"500",
        img:"https://eucys.eu/wp-content/uploads/2019/09/ribbon_prize-300x300.png",
    },
];

// Generate random float in range min-max:
const rand = (m, M) => Math.random() * (M - m) + m;


class WheelOfFortune {
    constructor() {
        this.createWheel();
        this.tot = sectors.length;
        this.elSpin = document.querySelector("#spin");
        this.ctx = document.querySelector("#wheel").getContext`2d`;
        this.dia = this.ctx.canvas.width;
        this.rad = this.dia / 2;
        this.PI = Math.PI;
        this.TAU = 2 * this.PI;
        this.arc = this.TAU / sectors.length;
        this.friction = 0.991;  // 0.995=soft, 0.99=mid, 0.98=hard
        this.angVelMin = 0.002; // Below that number will be treated as a stop
        this.angVelMax = 0; // Random ang.vel. to acceletare to
        this.angVel = 0;    // Current angular velocity
        this.ang = 0;       // Angle rotation in radians
        this.isSpinning = false;
        this.isAccelerating = false;
        this.elSpin.addEventListener("click", () => {
            if (this.isSpinning) return;
            this.isSpinning = true;
            this.isAccelerating = true;
            this.angVelMax = rand(0.25, 0.40);
        });

        sectors.forEach(this.drawSector);
        this.rotate(); // Initial rotation
        this.engine(); // Start engine!
    }

    engine = () => {
        this.frame();
        requestAnimationFrame(this.engine)
    };

    frame = () => {

        if (!this.isSpinning) return;

        if (this.angVel >= this.angVelMax) this.isAccelerating = false;

        // Accelerate
        if (this.isAccelerating) {
            this.angVel ||= this.angVelMin; // Initial velocity kick
            this.angVel *= 1.06; // Accelerate
        }

        // Decelerate
        else {
            this.isAccelerating = false;
            this.angVel *= this.friction; // Decelerate by friction

            // SPIN END:
            if (this.angVel < this.angVelMin) {
                this.isSpinning = false;
                this.angVel = 0;
            }
        }

        this.ang += this.angVel; // Update angle
        this.ang %= this.TAU;    // Normalize angle
        this.rotate();      // CSS rotate!
    };

    getIndex = () => Math.floor(this.tot - this.ang / this.TAU * this.tot) % this.tot;


    rotate = () => {
        const sector = sectors[this.getIndex()];
        this.ctx.canvas.style.transform = `rotate(${this.ang - this.PI / 2}rad)`;
        this.elSpin.textContent = !this.angVel ? "SPIN" : sector.label;
        this.elSpin.style.background = sector.color;
    };

    drawSector = (sector, i) => {
        const ang = this.arc * i;
        this.ctx.save();
        // COLOR
        this.ctx.beginPath();
        this.ctx.fillStyle = sector.color;
        this.ctx.moveTo(this.rad, this.rad);
        this.ctx.arc(this.rad, this.rad, this.rad, ang, ang + this.arc);
        this.ctx.lineTo(this.rad, this.rad);
        this.ctx.fill();
        // TEXT
        this.ctx.translate(this.rad, this.rad);
        this.ctx.rotate(ang + this.arc / 2);
        this.ctx.textAlign = "right";
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 30px sans-serif";
        this.ctx.font = "22px serif";
        this.ctx.fillText(sector.label, this.rad - 40, 10);
        let base_image  = new Image();
        base_image.src = sector.img
        this.ctx.drawImage(base_image, 96, -12, 30, 30);
        this.ctx.restore();
    };

    createWheel = () => {
        document.body.innerHTML = `
            <div id="wheelOfFortune">
                <canvas id="wheel" width="250" height="250"></canvas>
                <div id="spin">SPIN asd asd asd as dasd as dasd asd asd as d</div>
            </div>
       `
    }

}



document.onreadystatechange = () => {
    if (document.readyState !== 'complete') return;
    addStyles()
    new WheelOfFortune();
};
