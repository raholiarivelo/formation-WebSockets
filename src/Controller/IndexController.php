<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Service\NotificationService;

class IndexController extends AbstractController
{
    /**
     * @Route("/index", name="index")
     */
    public function index(NotificationService $notificationService, Request $request): Response
    {
        if($request->isXmlHttpRequest()) {
            $key = $request->request->get('key');
            $message = $request->request->get('message');
            $notificationService->notify($key,$message);
        }
        return $this->render('index/index.html.twig', [
            'controller_name' => 'IndexController',
        ]);
    }
}
