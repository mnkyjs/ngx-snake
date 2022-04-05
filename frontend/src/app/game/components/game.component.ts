import { AfterViewInit, Component, ElementRef, Input, ViewChild } from "@angular/core";
import { filter, fromEvent, interval, map, tap } from "rxjs";

type IDirection = "right" | "left" | "up" | "down";
type IPosition = { x: number; y: number };

@Component({
  selector: "snake-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
})
export class GameComponent implements AfterViewInit {
  @ViewChild("canvas") foo!: ElementRef<HTMLCanvasElement>;
  @ViewChild("gamespace") space!: ElementRef<HTMLDivElement>;
  width = 300;
  height = 300;

  canvas!: HTMLCanvasElement;
  direction: IDirection = "right";
  ctx!: CanvasRenderingContext2D;
  food: IPosition = { x: 5, y: 9 };
  @Input() rows = 15;

  @Input() cols = 15;

  pxlSize = 20;

  gameOver = false;

  snake: IPosition[] = [
    {
      x: 2,
      y: 4,
    },
  ];

  constructor() {}

  ngAfterViewInit(): void {
    this.getCtx();
    fromEvent<KeyboardEvent>(document.body, "keyup")
      .pipe(
        tap((event) => {
          event.preventDefault();
          event.stopPropagation();
          event.cancelBubble = true;
        }),
        map((event) => event.code),
        map((code) => code.replace("Arrow", "").toLowerCase() as IDirection),
        filter((code) => ["right", "left", "up", "down"].includes(code))
      )
      .subscribe((code) => {
        console.log(code);
        this.direction = code;
      });

    interval(300).subscribe(() => this.draw());
  }

  moveSnake() {
    const snake = [...this.snake];
    let nextPos: IPosition = { ...snake[0] };
    switch (this.direction) {
      case "up":
        nextPos.y -= 1;
        break;
      case "down":
        nextPos.y += 1;
        break;
      case "left":
        nextPos.x -= 1;
        break;
      case "right":
        nextPos.x += 1;
        break;
    }
    nextPos = this.validatePosition(nextPos);
    this.eat(nextPos, snake);
    if (this.checkPositionInSnake(nextPos, snake)) {
      this.gameOver = true;
    }
    this.snake = [nextPos, ...snake];
  }

  validatePosition(pos: IPosition): IPosition {
    if (pos.y <= -1) {
      pos.y = this.rows - 1;
    }
    if (pos.y >= this.rows) {
      pos.y = 0;
    }
    if (pos.x <= -1) {
      pos.x = this.cols - 1;
    }
    if (pos.x >= this.cols) {
      pos.x = 0;
    }
    // console.log(pos);

    return pos;
  }

  eat(nextPos: IPosition, snake: IPosition[]) {
    if (nextPos.x !== this.food.x || nextPos.y !== this.food.y) {
      snake.pop();
    } else {
      const nSnake = [nextPos, ...snake];
      do {
        this.setFootPosition();
      } while (this.checkPositionInSnake(this.food, nSnake));
    }
    return snake;
  }

  setFootPosition() {
    this.food = {
      x: Math.floor(Math.random() * this.cols),
      y: Math.floor(Math.random() * this.rows),
    };
  }

  checkPositionInSnake(pos: IPosition, snake: IPosition[]): boolean {
    return snake.some((row) => row.x === pos.x && row.y === pos.y);
  }

  draw() {
    //  offset / 15 => pixelSize

    const pxlH = this.space.nativeElement.clientHeight / 20;
    const pxlW = this.space.nativeElement.clientWidth / 20;
    this.pxlSize = pxlH <= pxlW ? pxlH : pxlW;
    this.width = Math.floor(this.space.nativeElement.clientWidth / this.pxlSize) * this.pxlSize;
    this.height = Math.floor(this.space.nativeElement.clientHeight / this.pxlSize) * this.pxlSize;

    this.rows = this.height / this.pxlSize;
    this.cols = this.width / this.pxlSize;

    this.drawBG();
    if (!this.gameOver) {
      this.moveSnake();
    }
    this.drawSnake();
    this.drawFood();
    if (this.gameOver) {
      this.drawFinished();
    }
  }

  drawBG() {
    this.drawRect("#4B9664", 0, 0, this.canvas.width, this.canvas.height);
  }

  drawSnake() {
    this.snake.forEach((pos, index) => {
      if (index === 0) {
        this.drawSnakeFace(pos);
      } else {
        this.drawRect("deeppink", pos.x, pos.y);
      }
    });
  }

  drawSnakeFace(pos: IPosition) {
    const halfSize = this.pxlSize / 2;
    this.ctx.fillStyle = "deeppink";
    // Half Rect
    this.ctx.fillRect(
      pos.x * this.pxlSize + (this.direction === "left" ? halfSize : 0),
      pos.y * this.pxlSize + (this.direction === "up" ? halfSize : 0),
      this.direction === "left" || this.direction === "right" ? halfSize : this.pxlSize,
      this.direction === "left" || this.direction === "right" ? this.pxlSize : halfSize
    );
    this.ctx.beginPath();
    this.ctx.arc(pos.x * this.pxlSize + halfSize, pos.y * this.pxlSize + halfSize, halfSize, 0, Math.PI * 2, false);
    this.ctx.fill();
    const quarterSize = halfSize / 2;
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    // Eye
    this.ctx.arc(
      pos.x * this.pxlSize + (this.direction === "left" || this.direction === "right" ? halfSize : quarterSize),
      pos.y * this.pxlSize + (this.direction === "left" || this.direction === "right" ? quarterSize : halfSize),
      3,
      0,
      Math.PI * 2,
      false
    );
    this.ctx.stroke();
  }

  drawFood() {
    this.drawRect("#2EF789", this.food.x, this.food.y);
  }

  drawRect(color: string, x: number, y: number, w: number = this.pxlSize, h: number = this.pxlSize) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.pxlSize, y * this.pxlSize, w, h);
  }

  getCtx() {
    this.canvas = this.foo.nativeElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  drawFinished() {
    this.ctx.font = "48px serif";
    this.ctx.fillStyle = "#730942";
    this.ctx.fillText("Game Over!", 2 * this.pxlSize, (this.rows / 2) * this.pxlSize);
    this.ctx.fillText(
      "Points: " + this.snake.length,
      2 * this.pxlSize,
      (this.rows / 2) * this.pxlSize + this.pxlSize * 2
    );
  }
}
