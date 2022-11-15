import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  username: string = '';
  ticket: string = '';
  new_ticket: string = '';
  constructor(private api: ApiService) {
    this.username = this.api.Username;
    this.ticket = this.api.Ticket;
  }

  ngOnInit(): void {
    this.ticket = (Math.floor(Math.random() * 100000) + 100000).toString();
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.ticket);
  }

  createRoom() {
    this.api.createRoom(this.username, this.ticket);
  }
  joinRoom() {
    this.api.joinRoom(this.username, this.new_ticket);
  }
}
