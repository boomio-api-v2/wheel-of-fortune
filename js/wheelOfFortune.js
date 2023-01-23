//////Constants ///////
const localStoragePropertyName = 'boomioPluginWheelOfFortuneConfig';


const cssRules = `
#wheelOfFortune {
    display: inline-flex;
    position: fixed;
    overflow: initial;
    z-index: 1000;
}

#wheel {
    display: block;
}

.custom-close-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    right: 0px;
    font-size: 13px;
    top: 0px;
    color: #000;
    cursor: pointer;
    background-color: lightgray;
    width: 16px;
    height: 16px;
    border-radius: 20px;
    font-size: 10px;
    opacity: 0.45;
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

const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

//////////////////

/////// Drag Element /////////

class DragElement {
    constructor(elmnt) {
        this.elmnt = elmnt;
        this.pos1 = 0;
        this.pos2 = 0;
        this.pos3 = 0;
        this.pos4 = 0;

        if (isMobileDevice) {
            this.addMobileListener()
            return;
        }

        if (document.getElementById(elmnt.id + "header")) {
            // if present, the header is where you move the DIV from:
            document.getElementById(elmnt.id + "header").onmousedown = this.dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = this.dragMouseDown;

        }
    }
    addMobileListener() {
        let mobileX = 0;
        let mobileY = 0;
        this.elmnt.addEventListener('touchmove', (e) =>  {
            e.preventDefault()
            const { clientX, clientY } = e.touches[0];
            const isBlocking = this.checkIsMoveBlocking(clientX, clientY);
            if (isBlocking) return;
            this.elmnt.style.left = (clientX - mobileX) + 'px';
            this.elmnt.style.top = (clientY - mobileY) + 'px';
        })
        this.elmnt.addEventListener('touchstart', (e) => {
            const { clientX, clientY } = e.touches[0]
            const { left, top } = e.target.getBoundingClientRect();
            mobileX = clientX - left - 10;
            mobileY = clientY - top - 10;
        })

    }

    closeDragElement = () => {
        document.onmouseup = null;
        document.onmousemove = null;
    }

    checkIsMoveBlocking(x, y) {
        if (x <= 0 || y <= 0) return true;
        return false;
    }

    elementDrag = (e) => {
        e = e || window.event;
        e.preventDefault();
        this.pos1 = this.pos3 - e.clientX;
        this.pos2 = this.pos4 - e.clientY;
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;

        const xPosition = this.elmnt.offsetLeft - this.pos1;
        const yPosition = this.elmnt.offsetTop - this.pos2;

        const isBlocking = this.checkIsMoveBlocking(xPosition, yPosition);
        if (isBlocking) return;

        this.elmnt.style.top = yPosition + "px";
        this.elmnt.style.left = xPosition + "px";
    }

    dragMouseDown = (e) => {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;
        document.onmouseup = this.closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = this.elementDrag;
    }
}

///////////

const getRandomArbitrary = (min, max) => Math.random() * (max - min) + min;

class LocalStorageConfig {
    constructor() {
        this.config = this.getLocalStorageStringToObject()
    }
    getLocalStorageStringToObject() {
        const config = localStorage.getItem(localStoragePropertyName);
        return JSON.parse(config);
    }

    getDefaultConfig() {
        const config = this.config
        const list = config?.list ?? [];
        const animation = config?.animation ?? 0;
        return {
            animation,
            list
        };
    };
};


const rand = (m, M) => Math.random() * (M - m) + m;

class WheelOfFortune extends LocalStorageConfig {
    constructor() {
        super()
        this.addStyles(cssRules)
        this.createWheel();
        this.elSpin = document.querySelector("#spin");
        this.ctx = document.getElementById("wheel").getContext`2d`;
        this.config = super.getDefaultConfig();
        this.tot = this.config.list.length;
        this.dia = this.ctx.canvas.width;
        this.rad = this.dia / 2;
        this.PI = Math.PI;
        this.TAU = 2 * this.PI;
        this.arc = this.TAU / this.config.list.length;
        this.friction = 0.991;
        this.angVelMin = 0.002;
        this.angVelMax = 0;
        this.angVel = 0;
        this.ang = 0;
        this.isSpinning = false;
        this.isAccelerating = false;
        this.elSpin.addEventListener("click", () => {
            if (this.isSpinning) return;
            this.isSpinning = true;
            this.isAccelerating = true;
            this.angVelMax = rand(0.25, 0.40);
        });

        this.config.list.forEach(this.drawSector);
        if (document.readyState !== 'complete') return;
        const wheelOfFortune = document.getElementById('wheelOfFortune');
        wheelOfFortune.style.display = 'block';
        this.addCloseIconToElement(wheelOfFortune)

        new DragElement(wheelOfFortune)


        this.rotate(); // Initial rotation
        this.engine(); // Start engine!
        this.startAnimation();
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
        const sector = this.config.list[this.getIndex()];
        this.ctx.canvas.style.transform = `rotate(${this.ang - this.PI / 2}rad)`;
        this.elSpin.innerHTML = !this.angVel ? "SPIN" : `
            <img style="width: 40px; height: 40px" src="${sector.img}"></img>
        `;
        this.elSpin.style.background = sector.color;
    };


    drawSector = (sector, i) => {
        const ang = this.arc * i;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.fillStyle = sector.color;
        this.ctx.moveTo(this.rad, this.rad);
        this.ctx.arc(this.rad, this.rad, this.rad, ang, ang + this.arc);
        this.ctx.lineTo(this.rad, this.rad);
        this.ctx.fill();
        this.ctx.translate(this.rad, this.rad);
        this.ctx.rotate(ang + this.arc / 2);
        this.ctx.textAlign = "right";
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 30px sans-serif";
        this.ctx.font = "14px serif";
        const img = new Image();
        img.src = sector.img
        this.ctx.drawImage(img, 86, -12, 32, 32);
        this.ctx.fillText(sector.label, this.rad - 55, 10);
        this.ctx.restore();
    };

    createWheel = () => {
        document.body.innerHTML = `
            <div id="wheelOfFortune" style="display: none" class="boomio--animation__wrapper boomio--animation__wrapper--initial">
                <canvas id="wheel" width="250" height="250"></canvas>
                <div id="spin">SPIN asd asd asd as dasd as dasd asd asd as d</div>
            </div>
       `
    }

    startAnimation = () => {

        const { animation } = this.config;
        const puzzleSize = 250;
        const animationEl = document.getElementById('wheelOfFortune');


        const systemFont =
            'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue';
        const duration = '1000ms';
        const easingBack = 'cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        const easing = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

        const { clientWidth, clientHeight } = document.documentElement;

        const posx = getRandomArbitrary(0, clientWidth - 250).toFixed();
        const posy = getRandomArbitrary(0, clientHeight - 250).toFixed();

        const initialPosition = {
            x: animationEl.clientWidth + parseInt(posy),
            nx: -1 * (animationEl.clientWidth + parseInt(posy)),
            y: animationEl.clientHeight + parseInt(posx),
            ny: -1 * (animationEl.clientHeight + parseInt(posx)),
        };
        const css = `
        .boomio--puzzle-widget-text {
            width: 100%;
            z-index: 100000;
            position: absolute;
            cursor: pointer;
            color: white;
            font-weight: bold;
            top: 50px;
            font-size: ${isMobileDevice ? 20 : 36}px;
            text-align: center;
        }
		.boomio--animation__wrapper {
			text-align: center;
			position: fixed;
			z-index: 9999;
			left: ${posx}px;
			top: ${posy}px;
			visibility: visible;
			background-size: cover;
			opacity: 1;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
		}
        .boomio--animation__wrapper {
          outline: none !important;
        }
        .boomio--animation__wrapper:empty {
			display: block !important;
		}
		.boomio--animation__wrapper--initial {
			width: ${puzzleSize}px;
			cursor: pointer;
			transition: transform 300ms cubic-bezier(0.18, 0.89, 0.32, 1.28);
			animation-duration: ${duration};
			animation-timing-function: ${easing};
			animation-iteration-count: 1;
		}

		.boomio--animation__wrapper--initial:hover {
			transform: scale(1.1);
		}

		// .boomio--animation__wrapper--initial:active {
		// 	transform: scale(.9);
		// }

		.boomio--animation__wrapper--qr {
			animation-name: boomio-animate-qr;
			animation-duration: 300ms;
			animation-timing-function: cubic-bezier(0.18, 0.89, 0.32, 1.28);
			animation-fill-mode: forwards;
			animation-iteration-count: 1;
			background-color: #ffffff;
			box-shadow: rgba(22, 31, 39, 0.42) 0px 60px 123px -25px, rgba(19, 26, 32, 0.08) 0px 35px 75px -35px;
			// padding: 16px;
			border-radius: 7px;
		}

		.boomio--animation__heading {
			color: #000;
			font: 22px/1.2 ${systemFont};
			margin: 0 0 16px;
		}

		h4.boomio--animation__heading {
			font-size: 16px;
			opacity: .7;
			margin-top: -8px;
		}

		.boomio--animation--moveRight { animation-name: boomio-animate--moveRight; animation-timing-function: ${easingBack}; }
		.boomio--animation--moveLeft { animation-name: boomio-animate--moveLeft; animation-timing-function: ${easingBack}; }
		.boomio--animation--moveUp { animation-name: boomio-animate--moveUp; }
		.boomio--animation--moveDown { animation-name: boomio-animate--moveDown; }
		.boomio--animation--moveDiagonalDown { animation-name: boomio-animate--moveDiagonalDown; }
		.boomio--animation--moveDiagonalUp { animation-name: boomio-animate--moveDiagonalUp; }
		.boomio--animation--fadeIn { animation-name: boomio-animate--fadeIn; }
		.boomio--animation--zoomIn { animation-name: boomio-animate--zoomIn; animation-timing-function: ${easingBack}; }
		.boomio--animation--rotateRight { animation-name: boomio-animate--rotateRight; animation-timing-function: ${easingBack}; }
		.boomio--animation--skewLeft { animation-name: boomio-animate--skewLeft; }
		.boomio--animation--tada { animation-name: boomio-animate--tada; }
		.boomio--animation--lightSpeedInLeft { animation-name: boomio-animate--lightSpeedInLeft; }
		.boomio--animation--rollIn { animation-name: boomio-animate--rollIn; }

		@keyframes boomio-animate-qr {
			0% {
				transform: scale(0);
			}
			100% {
				transform: scale(1);
			}
		}

		@keyframes boomio-animate--rollIn {
			from {
				opacity: 0;
				transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg);
			}
		
			to {
				opacity: 1;
				transform: translate3d(0, 0, 0);
			}
		}
		
		@keyframes boomio-animate--lightSpeedInLeft {
			from {
				transform: translate3d(${initialPosition.nx}px, 0, 0) skewX(30deg);
				opacity: 0;
			}
		
			60% {
				transform: skewX(-20deg);
				opacity: 1;
			}
		
			80% {
				transform: skewX(5deg);
			}
		
			to {
				transform: translate3d(0, 0, 0);
			}
		}
		
		@keyframes boomio-animate--tada {
			from {
				transform: scale3d(1, 1, 1);
			}
		
			10%,
			20% {
				transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
			}
		
			30%,
			50%,
			70%,
			90% {
				transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
			}
		
			40%,
			60%,
			80% {
				transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
			}
		
			to {
				transform: scale3d(1, 1, 1);
			}
		}

		@keyframes boomio-animate--moveRight {
			0% {
				transform: translateX(${initialPosition.nx}px);
			}
			100% {
				transform: translateX(0);
			}
		}

		@keyframes boomio-animate--moveLeft {
			0% {
				transform: translateX(${initialPosition.x}px);
			}
			100% {
				transform: translateX(0);
			}
		}

		@keyframes boomio-animate--moveDown {
			0% {
				transform: translateY(${initialPosition.ny}px);
			}
			100% {
				transform: translateY(0);
			}
		}
		
		@keyframes boomio-animate--moveUp {
			0% {
				transform: translateY(${initialPosition.y}px);
			}
			100% {
				transform: translateY(0);
			}
		}

		@keyframes boomio-animate--fadeIn {
			0% {
				opacity: 0;
			}
			100% {
				opacity: 1;
			}
		}
		
		@keyframes boomio-animate--moveDiagonalDown {
			0% {
				transform: translate(${initialPosition.nx}px, ${initialPosition.ny}px);
			}
			100% {
				transform: translate(0, 0);
			}
		}
		
		@keyframes boomio-animate--moveDiagonalUp {
			0% {
				transform: translate(${initialPosition.nx}px, ${initialPosition.y}px);
			}
			100% {
				transform: translate(0, 0);
			}
		}
		`;

        this.addStyles( css);
        const animFunc = this.getAnimateFunction(animation);
        animFunc(animationEl);
    };

    getAnimateFunction = (nr) => {
        const animate = (animation) => (el) => {
            el.classList.add(`boomio--animation--${animation}`);
        };
        const animArr = [
            animate('moveRight'),
            animate('moveLeft'),
            animate('moveDown'),
            animate('moveUp'),
            animate('fadeIn'),
            animate('moveDiagonalDown'),
            animate('rotateRight'),
            animate('zoomIn'),
            animate('skewLeft'),
            animate('moveDiagonalUp'),
            animate('tada'),
            animate('lightSpeedInLeft'),
            animate('rollIn'),
        ];

        return animArr[nr]
    }

    addStyles = (cssRules) => {
        const style = document.createElement('style');
        style.setAttribute('id', 'boomio--stylesheet');
        document.getElementsByTagName('head')[0].appendChild(style);
        if (style.styleSheet) {
            style.styleSheet.cssText = cssRules;
        } else {
            style.appendChild(document.createTextNode(cssRules));
        }
    };

    addCloseIconToElement = (element) => {
        const closeBtn = document.createElement('div')
        closeBtn.classList.add('custom-close-icon')
        closeBtn.innerHTML = '&#x2715; ';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            e.preventDefault()
            element.remove()
        },{ once: true })
        element.appendChild(closeBtn)
    }

}

document.onreadystatechange = () => {
    new WheelOfFortune();
};
