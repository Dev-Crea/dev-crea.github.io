// Gestion de la MAJ automatique des résulats par Javascript
// Seuls sont MAJ les blocs de classe "bloc_colonne" 
// ( #Ecran .colonne .bloc|.bloc_partiel .bloc_colonne)
// La mise à jour d'autres parties de l'écran doit donc se faire par un refresh général de la page.

	
var HeureMAJOK;			// Heure de dernière MAJ correctement effectuée
var IntervalID;			// Id du timer
var IDTimerScroll;		// Id du timer du scroll
var FichierCss;			// Feuille de style utilisateur
var Refresh;			// Durée de refresh
var AutoScroll			// Fréquence de scrolling des résultats
// var IdConfig;			// Numéro de la configuration à afficher
// var	Refresh;			// Durée de raffraichissement
// var EtatFct;			// Etat de fonctionnement OK:Fonctionne, ERR:En erreur, STP:Stoppé
var IdCategorieDetail;	// Id de la catégorie ouverte en détail dans l'écran mosaïque

function InitMaj()
// Initialisation de la MAJ
{

	HeureMAJOK = new Date();
	// var Refresh  = $("#parametres #refresh").attr("value","5");	// A SUPPRIMER, pour les TESTS
	// console.log("Changement du Refresh pour test : "+Refresh);

	// Récupération des paramètres de MAJ
	var IdConfig = $("#parametres #config").attr("value");		// N° de configuration
	Refresh      = $("#parametres #refresh").attr("value");		// Durée de refresh
	AutoScroll   = $("#parametres #autoscroll").attr("value");	// Fréquence de scrolling des résultats
	FichierCss   = $("#parametres #css").attr("value");			// Feuille de style
	$("#ecran").after("<div id='temp' style='display:none;'></div>");		// Ajout d'un bloc masqué pour récupérer les MAJ

	// $("#animrefresh").position({my: "right bottom", at: "center bottom", of:"#ecran", within: "window"});	// Centrage 

	// Action sur certaines zones (attention, a mettre aussi dans Maj_Ok() pour qu'ils s'activent aussi après MAJ)
	$("th.status").click(function(){ ScrollingBlocs()} );
	// $("tr.ligne_entete th").click(DisplayMasque);
	$(".affparam").click(DisplayMasque);	// Affichage des paramètres de la variante
	$("#default_img").click(DisplayMasque);	// Sur click de l'image par défaut d'une config vide
	$(".bouton_infos").click(AfficheInfoPassage);	// Affichage du bloc d'info des passages
	
	// console.log("IdConfig: "+IdConfig);
	// console.log("Refresh: "+Refresh);
	// console.log("FichierCss: "+FichierCss);
	
	$("#fixe").fadeToggle("slow");	// Masquage des informations
	
	// RunMAJ();			// Refresh une première fois de la page
	RunTimerRefresh(Refresh);	// Activation du timer de raffraichissement
	RunTimerScroll(AutoScroll);	// Activation du timer de scrolling
}

function RunTimerRefresh(nbsec) 
// Déclenchement ou Arrêt du Timer de Refresh des Pages
{
	// alert("Démarrage Timer");
	if (IntervalID>0) window.clearInterval(IntervalID);
	if (nbsec>0) 
	{
		IntervalID  = window.setInterval(function () {RunMAJ()}, nbsec*1000);
		var NomVariante = $("#parametres #nomvariante").attr("value");	// Nom de la variante actuelle
		$("title").text(NomVariante+" / "+nbsec+"s");
	}
	else
	{
		$("title").text("Timer stoppé !");
	}
	$("#timer").attr("value",nbsec);
}

function RunTimerScroll(nbsec) 
// Déclenchement ou Arrêt du Timer de Scrolling des Résultats
{
	// alert("Démarrage Timer");
	if (IDTimerScroll>0) window.clearInterval(IDTimerScroll);
	if (nbsec>0) 
	{
		IDTimerScroll  = window.setInterval(function () {ScrollingBlocs()}, nbsec*1000);
	}
}

function RunMAJ()
// Appel de la MAJ de la page. La MAJ se fait dans Replace_MajAuto()
{
	// alert("Appel RunMAJ()");
	
	var IdConfig = $("#parametres #config").attr("value");		// N° de configuration
	// IdCategorieDetail=99;	// Test
	
	$.ajax(
		{
		type: "POST",
		url: "bloc.php ",
		// data: {IdConfig : IdConfig},
		data: 'IdConfig='+IdConfig+'&DetailIdCat='+IdCategorieDetail,
		// data : 'email=' + email + '&contenu=' + contenu_mail,
		dataType: "html",
		complete: function(xhr, msg){
		},
	success: function(msg)
		{
		Replace_MajAuto(msg);	// Remplacement bloc de résultats par blocs de résultats
		},
	error: function(msg, ErrText, ObjExc)
		{
		Erreur_MAJ("Erreur au chargement ! ");
		}
	});
}


function Replace_MajAuto(message) 
// Modifie les resultats avec le nouveau contenu de Message 
// La MAJ se fait bloc par bloc, des "bloc_colonne" dans des "bloc_relais"/"bloc_partiel" dans les "colonne"
// - #temp #ecran .colonne [] .bloc [] .bloc_colonne
// - #temp #ecran .colonne [] .bloc_partiel [] .bloc_colonne
// - Les .bloc doivent avoir un identifiant unique qui fait la relation entre #temps et l'affichage actuel
// La MAJ se fait également sur tous les blocs avec de class ".majauto" 
// - Remplace les blocs de #ecran portant la class "majauto" par leur bloc de même "id" dans #temp
{

	$("#animrefresh").fadeIn("fast");
	var IdVariante = $("#parametres #variante").attr("value");	// On récupère le n° de variante actuelle
	var	HeureBloc  = $("#parametres #heure").attr("value");		// Heure du bloc actuel
	var Refresh  = $("#parametres #refresh").attr("value");		// Durée de refresh actuelle
	FichierCss = $("#parametres #css").attr("value");			// Feuille de style actuelle

	// console.log("Variante actuelle : "+IdVariante);		// Débug du n° de variante

	
	$("#temp").html(message);	// Copie du message dans le bloc temporaire

	if($("#temp #ecran").lenght==0)
	{
		console.log("Pas de div #ecran dans #temp !");
		Erreur_MAJ("Pas de div #ecran dans #temp !");
		return;
	}
	
	var NewHeure =  $("#temp #parametres #heure").attr("value");	// Heure du nouveau bloc
	var TypeMaj =  $("#temp #ecran").attr("typemaj");				// Type de refresh

	// Changement de type de raffraichissement
	if(TypeMaj=='R')
	{
		// Raffraichissement par Refresh total de la page
		window.location.reload(true);	// Rechargement de la page depuis le serveur (sans cache)
		return;
	}

	
	if( NewHeure>HeureBloc )	// Vérification de la présence d'un contenu "ecran", et d'une heure postérieure
	{ 
		$("#parametres").replaceWith($("#temp #parametres"));	// Remplacement du bloc #parametres
		var NewVar = $("#parametres #variante").attr("value");	// On récupère le nouveau n° de variante 
		$("#datas").text("Variante : "+NewVar);					// Affichage du n° de variante
		
		// alert("Apres replace");
		if(IdVariante != NewVar) 
		{
			// Variante différente, MAJ avec effet de transition
			// FadeOutEcran();
			$("#temp #ecran").attr("style","opacity:0;")	// Opacité à zéro du nouveau bloc (pour démarrer un FadeIn ensuite)
			$("#ecran").fadeTo("slow",0.01, MoveEcran);		// Effacement progressif de l'ancien bloc, puis lancement de MoveEcran()
			// MoveEcran() va déplacer le bloc et l'afficher avec un FadeIn
			$("#heurevariante").attr("value",HeureBloc);		// Changement de l'heure de la variante
			$("#animrefresh").fadeOut();
	
		}
		else
		{	
			// Même variante, MAJ des blocs ayant la class "majauto"
			
			// Bouclage sur tous les Blocs de class "majauto" dans #temp
			$("#temp #ecran .majauto").each(function(){

				var IdBlocMaj = $(this).attr("id");
				console.log("Maj du bloc 'majauto' : "+IdBlocMaj);
				// Remplacement du bloc "majauto" identifié
				$("#ecran #"+IdBlocMaj).replaceWith($("#temp #ecran #"+IdBlocMaj));	
					
			});
				

			$("#temp").empty();										// Efacement du contenu du bloc temporaire
			
			var NewCss = $("#parametres #css").attr("value");			// On récupère la nouvelle feuille de style
			if (NewCss!=FichierCss)
			{	
				// Changement de la feuille de style utilisateur
				// console.log("Changement de la feuille de style par "+NewCss);
				$("link[href='css_users/"+FichierCss+"']").attr("href","css_users/"+NewCss);
				FichierCss = NewCss;
			}
			$("#animrefresh").fadeOut();	// Effacement du signal de MAJ des données
			Maj_Ok();
		}
	
		// Changement des timers si nécéssaire
		var NewRefresh = $("#parametres #refresh").attr("value");
		if (Refresh != NewRefresh) RunTimerRefresh(NewRefresh);
		var NewScroll = $("#parametres #autoscroll").attr("value");
		if (AutoScroll != NewScroll) RunTimerScroll(NewScroll);
	}
	else
	{
		console.log("Pas de div #ecran ou Heure non postérieure !");
		Erreur_MAJ("Pas de div #ecran ou Heure non postérieure !");
	}
	
}

function MoveEcran()
// MAJ après un changement de variante
// Déplace le bloc #ecran de #temp dans body, et l'affiche en FadeIn
// Remplace également la feuille de style utilisateur
{
	// alert("Replace");
	HeureMAJOK = new Date()
	var Heure = HeureMAJOK.toLocaleTimeString();
	var NewCss = $("#parametres #css").attr("value");			// On récupère la nouvelle feuille de style
	// var Css = $("link[href='css_users/"+FichierCss+"']");
	// console.log(Css);
	if (NewCss!=FichierCss)
	{	
		// Changement de la feuille de style utilisateur
		// console.log("Changement de la feuille de style par "+NewCss);
		$("link[href='css_users/"+FichierCss+"']").attr("href","css_users/"+NewCss);
		FichierCss = NewCss;
	}
	$("#ecran").replaceWith($("#temp #ecran"));		// Remplacement du bloc #ecran
	$("#temp").empty();								// Efacement du contenu du bloc temporaire
	// $("#temp").remove();							// Suppression du bloc temporaire
	// alert("FadeIn");
	FadeInEcran();									// Affichage progressif du nouveau bloc
	Maj_Ok();
	
}

function Maj_Ok()
// Marquage de la MAJ est bien effectuée
{
	HeureMAJOK = new Date()
	var Heure = HeureMAJOK.toLocaleTimeString();
	var nbOk = $("#nbok").attr("value");
	var NomVariante = $("#parametres #nomvariante").attr("value");	// Nom de la variante actuelle
	$("title").text(NomVariante+' / '+Heure);		/* Heure dans le titre de la fenêtre */
	if ($("#status").attr("value")=="ERR")
	{
		$("#heureerr").attr("value","");
		$("#erreurcnx").fadeOut("slow");
		var Refresh = $("#parametres #refresh").attr("value");
		RunTimerRefresh(Refresh);		// On remet le timer à sa valeur initiale
	}
	$("#nbok").attr("value", ++nbOk);	// Incrément compteur de MAJ
	$("#heureok").attr("value",Heure);
	$("#status").attr("value","OK");

	// On remet les events sur les nouveaux blocs
	$(".affparam").click(DisplayMasque);	
	$(".bouton_infos").click(AfficheInfoPassage);	// Affichage du bloc d'info des passages
	$("th.status").click(function(){ ScrollingBlocs()} );

}

function Erreur_MAJ(statusText) 
// Marquage qu'une erreur est survenue
{
	var HeureErreur = new Date()
	var Heure = HeureErreur.toLocaleTimeString();
	var nbErr = $("#nberreur").attr("value");
	var status = $("#status").attr("value");
	var duree = Math.floor((HeureErreur - HeureMAJOK)/1000);
	
	// console.log("Duree erreur : "+duree);
	
	if (status!="ERR")
	{
		// Nouvelle erreur
		$("#heureerr").attr("value",Heure);
		$("#nberreur").attr("value", ++nbErr);	// Incrément compteur d'erreurs
		$("title").text("Erreur");
	}

	if(duree>30)
	{
		// Affichage du msg d'erreur
		// $("#erreurcnx").fadeOut("slow");
		$("#erreurcnx").fadeIn("slow");
		$("#erreurcnx").position({my: "center top", at: "center", of:"#ecran" ,within: "window"});	// Centrage de l'erreur
	}

	$("#dureeerreur").attr("value",duree+' s');
	$("#status").attr("value","ERR");
	RunTimerRefresh(5);		// On retente la MAJ dans 5 secondes !
}

function DisplayMasque() 
// Affiche ou masque les parametres et les boutons Javascript
{
	$("#masque").slideToggle("fast");
	$("#boutons").slideToggle("fast");

	// $("#animrefresh").fadeIn();
	// $("#animrefresh").position({my: "right bottom", at: "center bottom", of:"#masque"});	

}

function AfficheInfoPassage() 
// Affiche les parametres de passage à un/des postes
{
	$IdInfo=$(this).attr("data");	// Numéro du bloc
	// alert("AfficheInfoPassage : "+$IdInfo);

	$Info=$("#infos_passages_"+$IdInfo).clone();	// Duplication de l'info-param correspondant au bloc
	// $("#ecran").prepend("<p>TEST</p>");
	$IdAff=$("#ecran>.infos_passages").attr('id');
	// alert("AfficheInfoPassage : "+$IdAff+" infos_passages_"+$IdInfo);
	if($IdAff=="infos_passages_"+$IdInfo)
	{	
		$("#ecran>.infos_passages").toggle();
		// alert("AfficheInfoPassage : masquer");
	}
	else
	{
		$("#ecran>.infos_passages").remove();
		// Centrage sur #ecran
		// $Info.position({my: "center",at: "center",of: "#ecran"});
		$Info.prependTo("#ecran").prepend().show();


	}
	
	// $("#animrefresh").fadeIn();
	// $("#animrefresh").position({my: "right bottom", at: "center bottom", of:"#masque"});	

}

function ScrollingBlocs()
// Scrolling des tableaux de résultats dépassant la taille du bloc conteneur
{
	// On boucle sur tous les blocs de classe "bloc"
	$("#ecran .bloc").each(function(){

		var Bloc = $(this);
		var HauteurCont  = Bloc.parent().height();	// Hauteur du conteneur
		var PositionCont = Bloc.parent().position().top;		// Position relative du conteneur
		var HauteurBloc  = Bloc.height();			// Hauteur du résultat
		var PositionBloc = Bloc.position().top;		// Position relative du résultat
		
		if(PositionBloc<0) PositionBloc=0;
		var OffSet = (HauteurCont - HauteurBloc - PositionBloc + PositionCont);
		var Vitesse = -10 * OffSet ;
		
		var Id = $(this).attr('id');
		// var IdParent = Bloc.parent().attr('id');
		// console.log("Id : "+Id+"  Parent:"+IdParent);
		// console.log(Id+' Bloc: '+PositionBloc+' + '+HauteurBloc+' Cont: '+PositionCont+' + '+HauteurCont+' OffSet:'+OffSet);
		// console.log("Id : "+Id);
		// console.log("HauteurCont : "+HauteurCont);
		// console.log("HauteurBloc : "+HauteurBloc);
		// console.log("PositionBloc : "+PositionBloc);
		// console.log("OffSet : "+OffSet);
		
		if(OffSet < -1)	// Uniquement si bloc plus grand que le conteneur
		{
			// Bloc.animate({top: OffSet+'px' ,easing: 'swing'},Vitesse);		// On scroll vers le bas du bloc ('swing' :effet lent-rapide-lent)
			// Bloc.delay(2000).animate({top: '0px',easing: 'swing'},Vitesse);	// On revient en haut, après 2s d'arrêt
			Bloc.delay(2000).animate({top: OffSet+'px'},Vitesse*3,'linear');		// On scroll vers le bas du bloc ('linear' : effet constant)
			Bloc.delay(4000).animate({top: '0px'},Vitesse*3,'linear');	// On revient en haut, après 4s d'arrêt ('easeOutQuad' : effet avec ralenti)
		}
		
    });
}

$(document).ready(function()
{
	// RunTimerRefresh(5) ;
	InitMaj();	// Initialisation de la MAJ par javascript
	// $("#btn_hide").click(function(){ $("#titre").fadeToggle("slow");});
	
	$("#btn_stop").click(function(){ RunTimerRefresh(0);RunTimerScroll(0); } );
	$("#btn_timer").click(function(){ RunTimerRefresh(Refresh); RunTimerScroll(AutoScroll);	} );
	$("#btn_maj").click( RunMAJ);
	$("#btn_ok").click( Maj_Ok);
	$("#btn_err").click(function(){ Erreur_MAJ('')} );
	$("#btn_status").click(function(){ Maj_Ok('toto')} );
	$("#btn_hide").click(DisplayMasque);
	$("#btn_close").click(DisplayMasque);
	$("#btn_fadeout").click(FadeOutEcran);
	$("#btn_fadein").click(FadeInEcran);
	$("#btn_moveecran").click(MoveEcran);
	$("#erreurcnx").draggable();
	$("#erreurcnx").position({my: "center", at: "center", of:"#ecran" ,within: "window"});
	
	$("#btn_scroll").click(function(){ ScrollingBlocs()} );
	
	$("#pop_resultats").click(function(){ Masque_DetailCategorie()} );	// Fermeture du détail d'une catégorie dans la mosaïque

	$("#BlocDebug"    ).accordion( {collapsible: true, active: false, heightStyle: "content"} );
	$("#BlocDebugTab" ).accordion( {collapsible: true, active: false, heightStyle: "content"} );
	$("#BlocInfo"     ).accordion( {collapsible: true, active: 0, heightStyle: "content"} );
	$("#BlocErreur"   ).accordion( {collapsible: true, active: 0, heightStyle: "content"} );

});

	
// Clic sur une tuile de l'écran de mosaïque :
// affiche le détail de la catégorie passée en paramètre dans le block #pop_resultats
function Click_CategorieMosaique(IdCat)
{
	// alert("clic :"+IdCat);
	
	var Bloc=$( "#Cat"+IdCat+".resume_categorie" ).attr("id");
	// alert("Bloc :"+Bloc);
	
	if(Bloc>'')
	{
		// $( "#Cat"+IdCat+".resume_categorie" ).animate({
		  // width: 300,
		  // height: 600
		// }, 1000 );
		// $( "#Cat"+IdCat+".resume_categorie" ).addClass('detail_categorie');
		// $( "#Cat"+IdCat+".resume_categorie" ).removeClass('resume_categorie');
		// $("#pop_resultats").show( "scale", { percent: 100 }, 900);
		$("#pop_resultats").show( "clip", 500);
		IdCategorieDetail=IdCat;
		RunMAJ();

	}
	else
	{
		$( "#Cat"+IdCat+".detail_categorie" ).animate({
		  width: 200,
		  height: 80
		}, 1000 );
		$( "#Cat"+IdCat+".resume_categorie" ).addClass('resume_categorie');
		$( "#Cat"+IdCat+".resume_categorie" ).removeClass('detail_categorie');
		IdCategorieDetail=0;
	}
	
}

// Clic sur le block #pop_resultats :  efface ce bloc
function Masque_DetailCategorie()
{
	// alert($(event.target).prop('id'));
	
	if( $(event.target).prop('id')=='pop_resultats')	// On ne masque que si on clic en dehors des résultats
	{
		// Masquage de pop_resultats
		$("#pop_resultats").hide( "scale", 500);
		
		// On vide le contenu de pop_resultats pour que le prochain détail soit propre
		$("#pop_resultats div.bloc_colonne").empty();	// Vidage de chaque div.majauto enfant de #pop_resultats
		
	}
}

function FadeOutEcran() 
{
	$("#ecran").fadeTo("slow",0.01);
}
function FadeInEcran() 
{
	$("#ecran").fadeTo(3000,1);
}
function Test() {
	// alert("Test");
	// $.ajax('<h1>ESSAI</h1>');
	$("#commentaires").text('TEST');
}
/* Fonction appelée par le bouton dans le BlocParametres FormChoixModifConfig */
function AfficheConfig() 
{
	alert("Test AfficheConfig");
	// $.ajax('<h1>ESSAI</h1>');
	// $("#commentaires").text('TEST');
}
	
