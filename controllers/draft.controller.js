
const Helper = require("../helper"),
    DraftService = require('../service/draftService'),
    ENV = require('../config');

class DraftController {

    constructor(io)
    {
        this.io = io;

        this.io.on('connection',(socket) =>
        {

            socket.on( 'connection', (data) =>
            {
                const room = Helper.getSubdomain(socket.handshake.headers.origin);
                socket.join(room + '' +data. user_id);
                socket.join(room);

            });
            this.socket = socket;
            this.draftService = DraftService;
            this.ticketsDraft = {};
            this.individualTicketDrafts = {};
            this.newTicketDraft(this.socket);
            this.sendNewTicketDraftData(this.socket);
            this.sendNewTicketEvent(this.socket);
            this.setindividualdraftData(this.socket);
            this.createDraftIndividual(this.socket);

        });

    }

    //--------------  INDIVIDUAL PART ----------------------------//

    /**
     * send data after key up in individual textarea
     */

    setindividualdraftData(socket)
    {
        socket.on("setindividualdraftData", (data) =>
        {

            let user_id  = data.user_id;
            let user_token  = data.user_token;
            let mailbox_id = data.ticket.mailbox_id;
            let encriptData = data.encriptData;
            let room = data.room;
            let draft_id = data.draft_id;

            if(
                data.ticket.ticketDraft
                && !data.ticket.ticketDraft.reply
                && !data.ticket.ticketDraft.note
                && !data.ticket.ticketDraft.forwarding_emails.length
                && !data.ticket.ticketDraft.forward
            ) {
                if (data.ticket.ticketDraft.id) {
                    this.draftService.removeDraft(
                        user_token,
                        mailbox_id,
                        data.ticket.ticketDraft.id,
                        ENV.protocol + data.room + ENV.clientDomain
                    )
                        .then((htmlString) => {
                            if(this.individualTicketDrafts[socket.id]){
                                delete this.individualTicketDrafts[socket.id];

                            }
                            this.io.to(socket.id).emit('deleteIndividualTicketDraft',
                                {
                                    success: true,
                                    data: {
                                        mailbox_id: mailbox_id,
                                        draft_id: data.ticket.ticketDraft.id
                                    }
                                });
                        }).catch(function (err)
                    {
                    });

                }else{
                    delete this.individualTicketDrafts[socket.id];
                }
            }else
            {
                this.individualTicketDrafts[socket.id] = [
                    room,
                    user_id,
                    mailbox_id,
                    draft_id,
                    encriptData
                ];
            }
        })
    }

    /**
     * sent data to db
     */

    createDraftIndividual(socket)
    {

        socket.on("setIndividualDraftData", (data) =>
        {
            this.setIndividualDraftData(socket.id);
        });

        socket.on("disconnect", (data) =>{
            this.setIndividualDraftData(socket.id);
            this.sendNewTicketDraftData(socket.id);
        });
    }

    /**
     * after destroy component or after disconnect events sent draft data to db
     */

    setIndividualDraftData(socketId)
    {
        if(this.individualTicketDrafts[socketId]){
            let status = 'create';
            if(this.individualTicketDrafts[socketId].ticketDraft && this.individualTicketDrafts[socketId].ticketDraft.id){
                status = 'update';
            }
            this.draftService.addDraft(...this.individualTicketDrafts[socketId])
                .then( (htmlString) =>  {
                this.io.to(socketId).emit('sendIndividualTicketDraftClient', {data:htmlString,status:status});
                delete this.individualTicketDrafts[socketId];
            }).catch(function (err) {
                // Crawling failed...
            });
        }
    }


    //---------------------- END PART --------------------//




    //---------------------- NEW TICKET PART --------------//


    /***
     * send data after key up all input in form
     * @param socket
     */

    newTicketDraft(socket)
    {
        socket.on("newTicketDraft", (data) =>
        {
            if ( ! data.ticket.id )
                data.ticket.id = Date.now();

            this.ticketsDraft[socket.id] = [
                data.room,
                data.user_id,
                data.ticket.mailbox_id,
                data.ticket.id,
                data.encriptData
            ];

            this.draftService.addDraft(...this.ticketsDraft[socket.id])
        });
    }

    sendNewTicketEvent(socket)
    {
        socket.on("sendNewTicketDraftData", (data) => {

            this.sendNewTicketDraftData(socket.id);

        })
    }

    /**
     * after component destroy   event , sent data to db
     * @param socket
     */

    sendNewTicketDraftData(socketid)
    {

        if(this.ticketsDraft[socketid]){
            let status = 'create';
            if(this.ticketsDraft[socketid].ticket && this.ticketsDraft[socketid].ticket.draft_id){
                status = 'update';
            }

            if(    this.ticketsDraft[socketid].ticket
                && !this.ticketsDraft[socketid].ticket.body
                && !this.ticketsDraft[socketid].ticket.customer_name
                && !this.ticketsDraft[socketid].ticket.customer_email
                && !this.ticketsDraft[socketid].ticket.subject
            )
            {
                if (this.ticketsDraft[socketid].ticket.draft_id) {
                    this.draftService.removeDraft(
                        this.ticketsDraft[socketid].user_token,
                        this.ticketsDraft[socketid].mailbox_id,
                        this.ticketsDraft[socketid].ticket.id ,
                        this.ticketsDraft[socketid].originUrl
                    )
                        .then((htmlString) =>
                        {
                            this.io.to(socketid).emit('removeIndividualTicketDraft', {
                                success: true,
                                status:status,
                                data: {
                                    mailbox_id: this.ticketsDraft[socketid].mailbox_id,
                                    ticketId: this.ticketsDraft[socketid].ticket.draft_id
                                }
                            });
                            delete this.ticketsDraft[socketid];
                        }).catch(function (err) {
                        //         console.log(err)
                        });
                }else{
                    delete this.ticketsDraft[socketid];
                }
            }else{

                this.draftService.addDraft(...this.ticketsDraft[socketid])
                    .then( (htmlString) =>  {
                    // Process html...
                    this.io.to(socketid).emit('sendCreateTicketDraftClient',{status:status,data:htmlString});
                    delete this.ticketsDraft[socketid];

                }).catch(function (err) {
                    // Crawling failed...
                    //         console.log(err)

                });
            }
        }

    }

}

module.exports = DraftController;