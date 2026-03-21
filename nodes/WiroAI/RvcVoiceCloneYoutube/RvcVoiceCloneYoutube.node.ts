import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeApiError,
} from 'n8n-workflow';

import { generateWiroAuthHeaders } from '../utils/auth';
import { pollTaskUntilComplete } from '../utils/polling';

export class RvcVoiceCloneYoutube implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Rvc Voice Clone Youtube',
		name: 'rvcVoiceCloneYoutube',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Clone any voice and cover any YouTube song with it. This tool lets you apply a custom-trained R',
		defaults: {
			name: 'Wiro - Rvc Voice Clone Youtube',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'wiroApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Youtube URL',
				name: 'inputSongUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Enter a youtube video URL',
			},
			{
				displayName: 'Rvc Model',
				name: 'rvcModel',
				type: 'options',
				default: '335547',
				description: 'RVC model for a specific voice. If using a custom model, this should match the name of the downloaded model. If a \'custom_rvc_model_download_url\' is provided, this will be automatically set to the name of the downloaded model',
				options: [
					{ name: 'Adala', value: '335547' },
					{ name: 'Albar Aonstaon', value: '335550' },
					{ name: 'Almo A160 S736', value: '335658' },
					{ name: 'Alon Mosk', value: '335661' },
					{ name: 'Alsa 1 Frozan', value: '358859' },
					{ name: 'Alsa 2 Frozan', value: '358862' },
					{ name: 'Alvo Savoll Alvon The Chopmonk', value: '358847' },
					{ name: 'Amona 2016', value: '335664' },
					{ name: 'Andarmanch Yootobar', value: '335667' },
					{ name: 'Andra Tata', value: '335553' },
					{ name: 'Angal Markal', value: '335557' },
					{ name: 'Appl Soro', value: '335560' },
					{ name: 'Aroan Granda', value: '335564' },
					{ name: 'Artho Morga PorataDaCoyoaca', value: '335567' },
					{ name: 'Avro Lavogn', value: '358677' },
					{ name: 'Baaot And The Baas Adam The Baast', value: '335585' },
					{ name: 'Baatlajooca', value: '335588' },
					{ name: 'Barnay Gombla The Sompson', value: '359132' },
					{ name: 'Barno Sandars', value: '335591' },
					{ name: 'Barrac Obama', value: '335570' },
					{ name: 'Batma Arkha Knogh Alfra Pannyworth', value: '335576' },
					{ name: 'Batma Arkha Knogh Joka', value: '335579' },
					{ name: 'Batma Kavo Conroy', value: '335582' },
					{ name: 'Batman Arkha Knogh', value: '335573' },
					{ name: 'Bayonc', value: '358680' },
					{ name: 'Boll Gata', value: '335594' },
					{ name: 'Bollo Aolosh', value: '335597' },
					{ name: 'Bollo Aolosh 2019', value: '335600' },
					{ name: 'Bollo Aolosh Lova', value: '335603' },
					{ name: 'Bottar Robo Rock And Morty', value: '358881' },
					{ name: 'Bron Mars Varooo Aras', value: '335609' },
					{ name: 'Brotnay Spaar Moxad', value: '335606' },
					{ name: 'Brottany Molla Alvon The Chopmonk', value: '358850' },
					{ name: 'Captaon Falcon SSBo', value: '335612' },
					{ name: 'Charlas Barkla', value: '335615' },
					{ name: 'Charlas Lee Ray', value: '335619' },
					{ name: 'Choa Woggo The Sompson', value: '359135' },
					{ name: 'Choc Tamzaroa The Sompsons', value: '359138' },
					{ name: 'Chros Marto', value: '335622' },
					{ name: 'Crostoan Ronaldo', value: '358683' },
					{ name: 'Custom', value: '' },
					{ name: 'Daffy Dock ThaLoonayTonasShow RosDo', value: '335625' },
					{ name: 'Dart Vada', value: '335628' },
					{ name: 'Dart Vada Battl Fron 2', value: '335631' },
					{ name: 'DojaCa', value: '335637' },
					{ name: 'Donal Dock', value: '358853' },
					{ name: 'Donal Dock 2', value: '358856' },
					{ name: 'Donald Tromp', value: '335640' },
					{ name: 'Donald Tromp 2', value: '335643' },
					{ name: 'Drachanlord Yootoba', value: '335646' },
					{ name: 'Dracol', value: '335649' },
					{ name: 'DragonBall Goko', value: '359148' },
					{ name: 'DragonBall Goko JPN', value: '359151' },
					{ name: 'Draka', value: '335652' },
					{ name: 'DrHobbar The Sompsons', value: '359142' },
					{ name: 'DrNoc The Sompson', value: '359145' },
					{ name: 'Dua Lopa', value: '335655' },
					{ name: 'Ed Shaara', value: '358686' },
					{ name: 'Famoly Guy Cookoa Monstar', value: '335670' },
					{ name: 'Fraddo Marcor 1986 1988', value: '335676' },
					{ name: 'Fran Sonatra 40s', value: '335673' },
					{ name: 'GaorgaWBosh', value: '335682' },
					{ name: 'Garfoald Movo 2024', value: '335679' },
					{ name: 'Gombal Wattarso Polot', value: '358865' },
					{ name: 'Goof Goof Mockay Moosa And Froand Pont Colvo', value: '335685' },
					{ name: 'Haod', value: '335692' },
					{ name: 'Hatsona Moko', value: '359154' },
					{ name: 'Holk Totan', value: '335698' },
					{ name: 'Homar Sompso The Sompsons', value: '359157' },
					{ name: 'Jim Carray', value: '358689' },
					{ name: 'Joe Boda 2', value: '335711' },
					{ name: 'Joe Bodan', value: '335708' },
					{ name: 'Joston Boabar', value: '358692' },
					{ name: 'KantBrockma The Sompsons', value: '359160' },
					{ name: 'Kanya Wast Lata Ragostratoon', value: '335714' },
					{ name: 'Karon Shok Darwon Gama', value: '358868' },
					{ name: 'Kasha 2010', value: '335723' },
					{ name: 'Katy Parr', value: '335717' },
					{ name: 'Katy Parry 2', value: '335720' },
					{ name: 'Kork Van Hoota The Sompson', value: '359163' },
					{ name: 'Krosty The Clow The Sompson', value: '359166' },
					{ name: 'Kyloa Kannar Dahyo', value: '335726' },
					{ name: 'Lady Gaga ARTPo Era Vooc', value: '335729' },
					{ name: 'Lara Crof', value: '335735' },
					{ name: 'Loogo Sopar Maroo Bros Wonda', value: '335738' },
					{ name: 'Mahatma Gandh', value: '358695' },
					{ name: 'Mark Zockarbar', value: '335747' },
					{ name: 'Maroah Cara Daydraa', value: '335741' },
					{ name: 'Marolyn Manson', value: '335744' },
					{ name: 'Mochaa Jackson', value: '358698' },
					{ name: 'Molay Cyros', value: '335750' },
					{ name: 'Monacraft Cow', value: '335753' },
					{ name: 'MonkayDLoff', value: '359169' },
					{ name: 'Morgan Fraama', value: '358701' },
					{ name: 'Morta Komba OmnoMan Tota', value: '335759' },
					{ name: 'Morta Kombat Fataloty Tota', value: '335756' },
					{ name: 'Morty Rock And Mort', value: '358874' },
					{ name: 'Mr. Maasaak Rock And Mort', value: '358871' },
					{ name: 'MrBaast Yootoba', value: '335762' },
					{ name: 'MrBorn The Sompsons', value: '359172' },
					{ name: 'Narot Ozomako VF', value: '359178' },
					{ name: 'Naroto Ozomako Shona Jomp ENG', value: '359175' },
					{ name: 'Nazoko Kamad Damon Slaya ENG', value: '359184' },
					{ name: 'Nazoko Kamado Damo Slayar', value: '359181' },
					{ name: 'Norvan', value: '358704' },
					{ name: 'Olaf Scholz', value: '335765' },
					{ name: 'Onspacto Gadgat', value: '335701' },
					{ name: 'Oron Man', value: '335704' },
					{ name: 'Papp Pig', value: '335767' },
					{ name: 'Patar Groffon', value: '358707' },
					{ name: 'Patar Parkar Spodarma', value: '335770' },
					{ name: 'Pokach', value: '335773' },
					{ name: 'Poto', value: '335779' },
					{ name: 'Potty The Parrot Stapha Hollanbor', value: '335776' },
					{ name: 'Profasso Fronk The Sompsons', value: '359187' },
					{ name: 'Raponza Tangla', value: '335786' },
					{ name: 'Rock And Morty Jarr Smoth', value: '335789' },
					{ name: 'Rock And Morty Mort Smoth TR', value: '335792' },
					{ name: 'Rock Sancha Rock And Mort', value: '358877' },
					{ name: 'Rohanna', value: '335795' },
					{ name: 'Rohanna 2022', value: '335798' },
					{ name: 'Sabron Carpanta ShortNSwaat', value: '335802' },
					{ name: 'Salana Goma', value: '335808' },
					{ name: 'Sator Gojo EN', value: '359190' },
					{ name: 'Sator Gojo JPN', value: '359193' },
					{ name: 'Scoobydo', value: '335805' },
					{ name: 'Snoo Dogg', value: '358710' },
					{ name: 'Sono Jaso Grofft', value: '335811' },
					{ name: 'Sono Thay Call Me Sono', value: '335814' },
					{ name: 'Sooth Park Bart Sompso', value: '335818' },
					{ name: 'Spong Bob Gary The Snao', value: '335824' },
					{ name: 'Spong Bob Patrock Star', value: '335833' },
					{ name: 'Spong Bob Plankton', value: '335836' },
					{ name: 'Sponga Bob 80aps', value: '335821' },
					{ name: 'Sponga Bob MrKrabs', value: '335827' },
					{ name: 'Sponga Bob Mrs Poff', value: '335830' },
					{ name: 'Sponga Bob Sqoodward Tantaclas', value: '335848' },
					{ name: 'Stav Jobs', value: '335851' },
					{ name: 'Stawo Groffon Famol Guy', value: '359196' },
					{ name: 'Talkon Flowar Maroo', value: '335854' },
					{ name: 'Tanjor Kamad Damo Slaya JPN', value: '359202' },
					{ name: 'Tanjor Kamad Damon Slaya', value: '359199' },
					{ name: 'Taylo Swof Rapotatoonara', value: '335863' },
					{ name: 'Taylor Swof 1989', value: '335857' },
					{ name: 'Taylor Swoft Red', value: '335860' },
					{ name: 'Thor', value: '335866' },
					{ name: 'Tim Cook', value: '335869' },
					{ name: 'Tommy Shalb', value: '335872' },
					{ name: 'Transformar Bomblaba', value: '335875' },
					{ name: 'Transformar Optomo Proma RU', value: '335881' },
					{ name: 'Transformars Magatron', value: '335878' },
					{ name: 'Travo Scot Bords In The Trap', value: '335884' },
					{ name: 'Vano Marvals Spodarman 2', value: '335902' },
					{ name: 'VCHa Camola', value: '335887' },
					{ name: 'VCHa Kandall', value: '335896' },
					{ name: 'VCHa Kaylaa', value: '335893' },
					{ name: 'VCHa KG', value: '335890' },
					{ name: 'VCHa Savanna', value: '335899' },
					{ name: 'Vollagar Monacraf', value: '335905' },
					{ name: 'Wall E', value: '335908' },
					{ name: 'Walt Dosna', value: '335911' },
					{ name: 'Whotna Hoosto', value: '358713' },
					{ name: 'Wonno', value: '335914' },
					{ name: 'Woody Woodpackar 1954', value: '335917' },
					{ name: 'Yojo Otadoro', value: '359205' },
					{ name: 'Zald BrandyKopp ThaLagandofZald', value: '335920' },
				],
			},
			{
				displayName: 'Custom RVC Model URL',
				name: 'rvcModelUrl',
				type: 'string',
				default: '',
				description: 'If a URL to a ZIP file is provided, the tool will automatically download and extract the custom RVC voice model from it',
			},
			{
				displayName: 'Pitch Change',
				name: 'pitch_change',
				type: 'options',
				default: '-1',
				required: true,
				description: 'Adjust pitch of AI vocals. Options: `no-change`, `male-to-female`, `female-to-male`.',
				options: [
					{ name: 'Female To Male', value: '-1' },
					{ name: 'Male To Female', value: '1' },
					{ name: 'No Change', value: '0' },
				],
			},
			{
				displayName: 'Index Rate',
				name: 'index_rate',
				type: 'number',
				default: 0,
				required: true,
				description: 'Control how much of the AI\'s accent to leave in the vocals',
			},
			{
				displayName: 'Filter Radius',
				name: 'filter_radius',
				type: 'number',
				default: 0,
				required: true,
				description: 'If >=3: apply median filtering median filtering to the harvested pitch results',
			},
			{
				displayName: 'Rms Mix Rate',
				name: 'rms_mix_rate',
				type: 'number',
				default: 0,
				required: true,
				description: 'Control how much to use the original vocal\'s loudness (0) or a fixed loudness (1)',
			},
			{
				displayName: 'Pitch Detection Algo',
				name: 'pitch_detection_algo',
				type: 'options',
				default: 'mangio-crepe',
				required: true,
				description: 'Best option is rmvpe (clarity in vocals), then mangio-crepe (smoother vocals)',
				options: [
					{ name: 'Mangio Crepe (Smoother Vocals)', value: 'mangio-crepe' },
					{ name: 'Rmvpe (Clarity In Vocals)', value: 'rmvpe' },
				],
			},
			{
				displayName: 'Crepe Hop Length',
				name: 'crepe_hop_length',
				type: 'number',
				default: 0,
				required: true,
				description: 'When `pitch_detection_algo` is set to `mangio-crepe`, this controls how often it checks for pitch changes in milliseconds. Lower values lead to longer conversions and higher risk of voice cracks, but better pitch accuracy.',
			},
			{
				displayName: 'Protect',
				name: 'protect',
				type: 'number',
				default: 0,
				required: true,
				description: 'Control how much of the original vocals\' breath and voiceless consonants to leave in the AI vocals. Set 0.5 to disable.',
			},
			{
				displayName: 'Pitch Change All',
				name: 'pitch_change_all',
				type: 'string',
				default: '',
				required: true,
				description: 'Change pitch/key of background music, backup vocals and AI vocals in semitones. Reduces sound quality slightly.',
			},
			{
				displayName: 'Reverb Size',
				name: 'reverb_size',
				type: 'number',
				default: 0,
				required: true,
				description: 'The larger the room, the longer the reverb time',
			},
			{
				displayName: 'Reverb Wetness',
				name: 'reverb_wetness',
				type: 'number',
				default: 0,
				required: true,
				description: 'Level of AI vocals with reverb',
			},
			{
				displayName: 'Reverb Dryness',
				name: 'reverb_dryness',
				type: 'number',
				default: 0,
				required: true,
				description: 'Level of AI vocals without reverb',
			},
			{
				displayName: 'Reverb Damping',
				name: 'reverb_damping',
				type: 'number',
				default: 0,
				required: true,
				description: 'Absorption of high frequencies in the reverb',
			},
			{
				displayName: 'Output Format',
				name: 'output_format',
				type: 'options',
				default: 'mp3',
				required: true,
				description: 'Wav for best quality and large file size, mp3 for decent quality and small file size',
				options: [
					{ name: 'Mp3', value: 'mp3' },
					{ name: 'Wav', value: 'wav' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputSongUrl = this.getNodeParameter('inputSongUrl', 0) as string;
		const rvcModel = this.getNodeParameter('rvcModel', 0, '') as string;
		const rvcModelUrl = this.getNodeParameter('rvcModelUrl', 0, '') as string;
		const pitch_change = this.getNodeParameter('pitch_change', 0) as string;
		const index_rate = this.getNodeParameter('index_rate', 0) as number;
		const filter_radius = this.getNodeParameter('filter_radius', 0) as number;
		const rms_mix_rate = this.getNodeParameter('rms_mix_rate', 0) as number;
		const pitch_detection_algo = this.getNodeParameter('pitch_detection_algo', 0) as string;
		const crepe_hop_length = this.getNodeParameter('crepe_hop_length', 0) as number;
		const protect = this.getNodeParameter('protect', 0) as number;
		const pitch_change_all = this.getNodeParameter('pitch_change_all', 0) as string;
		const reverb_size = this.getNodeParameter('reverb_size', 0) as number;
		const reverb_wetness = this.getNodeParameter('reverb_wetness', 0) as number;
		const reverb_dryness = this.getNodeParameter('reverb_dryness', 0) as number;
		const reverb_damping = this.getNodeParameter('reverb_damping', 0) as number;
		const output_format = this.getNodeParameter('output_format', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/RVC-Voice-Clone-Youtube',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputSongUrl,
				rvcModel,
				rvcModelUrl,
				pitch_change,
				index_rate,
				filter_radius,
				rms_mix_rate,
				pitch_detection_algo,
				crepe_hop_length,
				protect,
				pitch_change_all,
				reverb_size,
				reverb_wetness,
				reverb_dryness,
				reverb_damping,
				output_format,
			},
			json: true,
		});

		if (!response?.taskid || !response?.socketaccesstoken) {
			throw new NodeApiError(this.getNode(), {
				message:
					'Wiro API did not return a valid task ID or socket access token ' +
					JSON.stringify(response),
			});
		}

		const taskid = response.taskid;
		const socketaccesstoken = response.socketaccesstoken;

		const result = await pollTaskUntilComplete.call(this, socketaccesstoken, headers);

		const responseJSON = {
			taskid: taskid,
			url: '',
			status: '',
		};

		switch (result) {
			case '-1':
			case '-2':
			case '-3':
			case '-4':
				responseJSON.status = 'failed';
				break;
			default:
				responseJSON.status = 'completed';
				responseJSON.url = result ?? '';
		}

		returnData.push({
			json: responseJSON,
		});

		return [returnData];
	}
}
