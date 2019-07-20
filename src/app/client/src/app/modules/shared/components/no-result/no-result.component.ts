import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import {INoResultMessage} from '../../interfaces/noresult';
/**
 * No Result component
 */
@Component({
  selector: 'app-no-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './no-result.component.html',
  styleUrls: ['./no-result.component.css']
})
export class NoResultComponent implements OnInit, OnChanges {
  /**
   * input for NoResultMessage
  */
  @Input() data: INoResultMessage;
  /**
   * no result message
  */
  message: string;
  /**
   * no result messageText for component
  */
  messageText: string;
  constructor() { }

  ngOnInit() {
    if (this.data) {
      this.message = this.data.message;
      this.messageText = this.data.messageText;
    }
  }
  ngOnChanges(inputChanges) {
    // this means that the language was changed
    if (inputChanges.data) {
      this.messageText = this.data.messageText;
    }
  }
}
