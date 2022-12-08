import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../api.service';
import { UserEditComponent } from './user-edit/user-edit.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  constructor(public api: ApiService, private dialog: MatDialog) {}

  ngOnInit(): void {}

  editUserInfo(user: any) {
    this.dialog.open(UserEditComponent, {
      data: { ...user },
    });
  }
}
