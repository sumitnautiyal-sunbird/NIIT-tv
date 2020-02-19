import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tiny-cards',
  templateUrl: './tiny-cards.component.html',
  styleUrls: ['./tiny-cards.component.scss']
})
export class TinyCardsComponent implements OnInit {

  @Input() textArray = [];
  constructor() { }

  ngOnInit() {
    if (this.textArray.length) {
      console.log('recieved conten array in card as ', this.textArray);
    }
  }

}
