import { Component,Input, OnInit } from '@angular/core';
import { ResourceService } from '../../services/index';
@Component({
  selector: 'app-allcurriculum',
  templateUrl: './allcurriculum.component.html',
  styleUrls: ['./allcurriculum.component.scss']
})
export class AllcurriculumComponent implements OnInit {

  @Input() activitytypecount: any;
  public resourceService: ResourceService;
  constructor(resourceService: ResourceService) {
    this.resourceService = resourceService;
  }
  ngOnInit() {
  }

}
