import { Inject, Component, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from 'src/app/api.service';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
})
export class UserEditComponent implements OnInit {
  username: string = '';
  imageNumber: number = 1;

  get getImageUrl() {
    return `https://i.pravatar.cc/300?img=${this.imageNumber}`;
  }

  constructor(
    public api: ApiService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit(): void {
    this.username = this.data.username;
    try {
      this.imageNumber =
        parseInt(this.data.image.split('?')[1].split('=')[1]) ?? 1;
    } catch {}
  }

  incDecNumber(inc: boolean) {
    this.imageNumber = inc
      ? this.imageNumber < 70
        ? this.imageNumber + 1
        : 1
      : this.imageNumber <= 1
      ? 70
      : this.imageNumber - 1;
  }

  submitResult() {
    let newImageUrl = `https://i.pravatar.cc/150?img=${this.imageNumber}`;
    this.api.changeUserInfo(this.data, this.username, newImageUrl);
  }
}
