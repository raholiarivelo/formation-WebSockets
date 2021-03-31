<?php
namespace App\Service;

use WebSocket\Client as WebSocketClient;

class NotificationService {
	
	public function getWsClient() {
      $ws = "ws://127.0.0.1:8100";
      $context = stream_context_create(['ssl' => [
           'verify_peer' => false,
           'verify_peer_name' => false,
           'allow_self_signed' => true,
           'verify_depth' => 0
       ]]);
        $wsClient = new WebSocketClient($ws,[
          'context'=>$context
        ]);
       return $wsClient;
   }

    public function notify($key,$message){
       $client = $this->getWsClient();
       $client->text(json_encode([
           [
               'type'=>'notify',
               'key'=>$key,
               'message'=>$message,
           ]
       ]));
   }
}