> Deep research de subagente (2026-10-03), solicitada pelo ozp.
> **Cumpre a gate registrada no SPEC: pesquisa metodológica antes de especificar o F5.**
> Consumir com o quadro 03a §7c e o checklist final deste doc.

# LLMs como participantes psicológicos: estado da arte metodológica (2023–2026) e implicações para o F5

*Deep research conduzida em 03/10/2026 via arXiv API, Crossref, OpenAlex e busca web. Toda âncora foi re-verificada; divergências em relação ao briefing estão sinalizadas.*

**Nota de verificação das âncoras:**

| Âncora | Status | Observação |
|---|---|---|
| "The Mask in the Inkblot" (DeTure & Claude, set/2026) | Verificado | Repo confirmado em detalhe (19 blots ASCII, 124 modelos, 2.847 respostas) |
| Argyle et al. 2023 "Out of One, Many" | Verificado | Political Analysis 31(3), DOI 10.1017/pan.2023.2 |
| Crítica "Simpson's paradox na agregação (ACM)" | **Não localizada** | Nenhum paper ACM conectando Simpson a agregação de opiniões simuladas foi encontrado em arXiv/Crossref/OpenAlex. O argumento substantivo existe e está coberto por literatura verificada (abaixo, §3.4) — possivelmente a referência é a outra, ou é memória de leitura |
| "Quality checks para amostras sintéticas (arXiv 2025)" | Mapeado a cluster | Não há um paper único com esse título; o conteúdo mapeia para Cummins 2025 (flexibilidade analítica), Sen et al. 2026 (TS2E), González-Bustamante 2025, Chapala et al. 2025 (§3) |
| "Fast silicon sampling" | Verificado | Lam, Voo & Ma, arXiv:2608.14079 (ago/2026) |
| "Homo silicus (Nan et al.)" | Corrigido | O termo é de **Horton 2023** (arXiv:2301.07543, NBER w31122, ACM EC'24). "Nan" é coautor de "Random Silicon Sampling" (Sun, Lee, Nan et al., arXiv:2402.18144) |
| Dillion et al. 2023 (TiCS) | Verificado | Trends in Cognitive Sciences 27(7):597–600 |
| TAT em modelos multimodais | Verificado | Dzega, Elyashar, Slobodin, Cohen & Puzis, arXiv:2602.17108 (fev/2026), SCORS-G |
| Rorschach-LLM 2025/26 | Verificados 3 | Zhao et al. 2026; Giacometti et al. 2026; Pimentel & Meyer, Assessment 2026 |
| Revisões de machine psychology | Verificados | Hagendorff et al. 2023 (posição); Binz & Schulz — **PNAS 2023**, não Nature Human Behaviour (erro comum, confirmado via Crossref: DOI 10.1073/pnas.2218523120) |

---

## 1. Estado do campo

A área consolidou-se em **seis linhas distinguíveis**, com venues e tradições próprias:

**1.1 Silicon sampling / simulação de opinião** (ciência política, economia, métodos de survey). Fundação: Argyle et al. 2023 ([doi.org/10.1017/pan.2023.2](https://doi.org/10.1017/pan.2023.2)) condiciona GPT-3 em backstories demográficas do ANES e cunha "algorithmic fidelity"; Horton 2023 formaliza o "homo silicus" ([arxiv.org/abs/2301.07543](https://arxiv.org/abs/2301.07543)). Variantes: Random Silicon Sampling (amostragem por distribuições demográficas de grupo, [arxiv.org/abs/2402.18144](https://arxiv.org/abs/2402.18144)) e fast silicon sampling (múltiplos respondentes por prompt; mais eficiente e fiel em médias, subestima variância — Lam et al., [arxiv.org/abs/2608.14079](https://arxiv.org/abs/2608.14079)). A linha virou majoritariamente **crítica/tecnológica**: Total Simulated Survey Error (Sen et al., [arxiv.org/abs/2609.10280](https://arxiv.org/abs/2609.10280)); flexibilidade analítica (Cummins, [arxiv.org/abs/2509.13397](https://arxiv.org/abs/2509.13397)); colapso de modo (Heath & Alexander, [arxiv.org/abs/2607.28550](https://arxiv.org/abs/2607.28550)); KNOWS/DOES split (Jang et al., EMNLP Findings 2026, [arxiv.org/abs/2607.25292](https://arxiv.org/abs/2607.25292)).

**1.2 Machine psychology / LLMs como sujeitos cognitivos** (psicologia cognitiva, NeurIPS-adjacente). Posição fundadora: Hagendorff, Dasgupta, Binz et al. 2023 ([arxiv.org/abs/2303.13988](https://arxiv.org/abs/2303.13988)) — aplicar paradigmas experimentais humanos a LLMs "para além de benchmarks de desempenho". Binz & Schulz administram baterias cognitivas ao GPT-3 ([PNAS 2023](https://doi.org/10.1073/pnas.2218523120)); a réplica de Stella, Hills & Kenett ([PNAS 2023](https://doi.org/10.1073/pnas.2312911120)) já delimita o que é contencioso. Repertório atual: jogos econômicos (Phelps & Russell, [arxiv.org/abs/2305.07970](https://arxiv.org/abs/2305.07970); Payne & Alloui-Cros, [arxiv.org/abs/2507.02618](https://arxiv.org/abs/2507.02618) — "impressões digitais estratégicas" por família de modelo), teoria da mente ([arxiv.org/abs/2608.04646](https://arxiv.org/abs/2608.04646)), mitos psicológicos ([arxiv.org/abs/2507.12296](https://arxiv.org/abs/2507.12296)), memória ([arxiv.org/abs/2403.05152](https://arxiv.org/abs/2403.05152)), e comportamento relacional/operante em sistemas não-LLM (Johansson — AARR/Relational Frame Theory em NARS, [arxiv.org/abs/2503.00611](https://arxiv.org/abs/2503.00611) e [arxiv.org/abs/2405.19498](https://arxiv.org/abs/2405.19498) — vizinho conceitual direto do MTS).

**1.3 LLMs como pacientes/informantes clínicos** (psiquiatria computacional, NLP clínico). PsychBench ([arxiv.org/abs/2503.01903](https://arxiv.org/abs/2503.01903)), MAGI ([arxiv.org/abs/2504.18260](https://arxiv.org/abs/2504.18260)), PsyCoT ([arxiv.org/abs/2310.20256](https://arxiv.org/abs/2310.20256)). Aqui o LLM é **instrumento de codificação**, não sujeito — relevante para o F5 como ferramenta de scoring (§4).

**1.4 Testes projetivos em LLMs/LMMs** (a linha mais próxima do F5; explodiu em 2026):
- **TAT multimodal**: Dzega et al., "Projective Psychological Assessment of Large Multimodal Models Using Thematic Apperception Tests" ([arxiv.org/abs/2602.17108](https://arxiv.org/abs/2602.17108)) — LMMs como modelos-sujeito (geram histórias a partir de pranchas) e modelos-avaliador (pontuam SCORS-G), com forte consistência dos avaliadores vs. especialistas humanos; falha consistente em perceber/regular agressão; modelos maiores/mais novos pontuam melhor.
- **Rorschach como estímulo**: Zhao, Guilbeault & Goldberg ([arxiv.org/abs/2606.30945](https://arxiv.org/abs/2606.30945)) — humanos exageram estereótipos em leituras de manchas; LLMs "alucinam estereótipos" de segunda ordem que não correspondem a diferenças grupais reais. Giacometti et al. ([arxiv.org/abs/2604.18437](https://arxiv.org/abs/2604.18437)) aplicam as 10 pranchas a 61 modelos de visão ImageNet e mostram divergência sistemática de perfis vs. humanos.
- **GenPT** (Wang et al., ACL 2026, [arxiv.org/abs/2606.00860](https://arxiv.org/abs/2606.00860); código: [github.com/sci-m-wang/GenPT](https://github.com/sci-m-wang/GenPT)) — **o antecedente intelectual mais próximo do F5**: reconhece que questionários autorrelato aplicados a LLMs sofrem contaminação de corpus e bias de desejabilidade social, e propõe "testagem projetiva generativa" com **estímulos recém-gerados** (TAT/Rorschach/SCT reformulados) para avaliar agentes condicionados a persona. Semina exatamente a vantagem do motor MTS.
- **"The Mask in the Inkblot"** (DeTure & Claude, set/2026, [github.com/sdeture/mask-in-the-inkblot](https://github.com/sdeture/mask-in-the-inkblot)) — nota de pesquisa (3 pp.) com engenharia metodológica exemplar: 19 manchas ASCII + MANIFEST.json com SHA1 por estímulo; 124 modelos, 2.847 respostas; variáveis de desenho (lab, release year, draw); flag binária de "concealment" + léxico de 83 palavras; análise congelada reproduzível (`rerun.py` conferiu "97 números" contra os dados brutos); QC com duas leituras a cegas externas; baseline "neither" para negação/incerteza; **leave-one-out por desenvolvedor, modelo e estímulo**; texto bruto retido (não publicado). Achado: modelos que negam experiência interna veem máscaras em 15,5% das respostas vs. baseline 3,4% (~4,6x).

**1.5 Psicometria crítica / contaminação** (NLP+psicometria). Han, Song, Lee & Jo, "Quantifying Data Contamination in Psychometric Evaluations of LLMs" ([arxiv.org/abs/2510.07175](https://arxiv.org/abs/2510.07175), EACL 2026 Findings) — primeiro framework sistemático: mede memorização de itens, memorização de avaliação e *target score matching*; BFI-44 e PVQ-40 fortemente contaminados (modelos conseguem "ajustar respostas para atingir pontuação-alvo"). Sühr et al., "Stop Evaluating AI with Human Tests" ([arxiv.org/abs/2507.23009](https://arxiv.org/abs/2507.23009)) — posição: testes humanos sem revalidação produzem inferências inválidas sobre LLMs. Cacioli ([arxiv.org/abs/2604.22215](https://arxiv.org/abs/2604.22215)) — tela pré-registrada de validade psicométrica em que 7/7 modelos instruídos falham validade de item em confiança verbalizada (91,7% de teto).

**1.6 Estatística e relato de experimentos com LLM** — Miller (Anthropic), "Adding Error Bars to Evals" ([arxiv.org/abs/2411.00640](https://arxiv.org/abs/2411.00640)): avaliações são experimentos sobre uma "superpopulação"; Tan & Zrnic, "Valid Inference with Synthetic Data via Task Exchangeability" ([arxiv.org/abs/2606.13629](https://arxiv.org/abs/2606.13629)) — garantias de inferência com dados sintéticos. Há ainda um paper de metodologia frequentemente citado, **"Putting Behavioral Science on Ice: How to Conduct Rigorous, Reliable, and Replicable LLM-based Research" (Akselrud, Rincón, Alonso & Leroi, 2025)** — advertência: **não consegui re-verificar URL/DOI** (não indexado em arXiv, Crossref ou OpenAlex nas buscas de out/2026); suas recomendações (relatar versão exata do modelo/data, temperatura, N repetições, pré-registro, validação humana das saídas) coincidem com o que as fontes verificadas sustentam, mas cite-o com cautela até confirmar a fonte primária.

**Consenso vs. contencioso.** Consenso: (i) LLMs produzem respostas human-plausíveis o suficiente para *pilotar* instrumentos e gerar hipóteses; (ii) auto-relato demográfico condicionado **não** substitui amostra humana para estimar distribuições; (iii) contaminação em instrumentos públicos é real e mensurável; (iv) versão/rota do modelo é variável experimental, não ruído; (v) avaliação requer validação humana quando há julgamento de conteúdo. Contencioso: se projeções de persona medem "personalidade do modelo" ou artefato de prompt; se comparabilidade com normas humanas é sequer um alvo legítimo (Binz & Schulz vs. Stella et al.); se benchmarks psicológicos de LLM devem herdar a psicometria humana (IRT/normas) ou construir testes específicos para IA (Sühr et al. defendem o segundo); e se "welfare stance" do próprio modelo (o objeto do Mask in the Inkblot) é variável psicológica legítima.

---

## 2. Metodologias: como os estudos conduzem

**2.1 Prompt design e persona conditioning.** Três gerações: (a) *backstory conditioning* densa estilo ANES (Argyle et al.); (b) persona por rótulo curto ("você é X") — sabidamente pior: Cheng et al., "Marked Personas" ([arxiv.org/abs/2311.10017](https://arxiv.org/abs/2311.10017)) mostram que marcas de identidade em prompts ativam estereótipos medidos; Santurkar et al., OpinionQA ([arxiv.org/abs/2303.18248](https://arxiv.org/abs/2303.18248)) mostram desalinhamento sistemático com grupos demográficos reais; (c) *persona deep* com memória/RAG (GenPT usa CharacterRAG/AnnaAgent). Wang ([arxiv.org/abs/2609.16395](https://arxiv.org/abs/2609.16395)) desmonta o pressuposto básico: silicon sampling recupera **assunções de nível-país**, não atitudes individuais — uma média de vizinhos sem LLM bate todas as condições testadas. Para o F5, o desenho Dual (com/sem persona) com baseline explícito estilo Mask ("neither") é o padrão defensável.

**2.2 Temperatura/sampling e N réplicas.** A prática consolidou: fixar seed e temperatura; tratar cada chamada como uma extração; replicar. Duas armadilhas quantificadas: (i) **mode collapse** — modelos instruídos "não amostram das distribuições que sabem descrever" (Jang et al., [arxiv.org/abs/2607.25292](https://arxiv.org/abs/2607.25292)); Heath & Alexander ([arxiv.org/abs/2607.28550](https://arxiv.org/abs/2607.28550)) contornam pedindo resposta em texto e mapeando para escala numérica via embeddings; (ii) réplica ≠ diversidade: fast sampling em um prompt produz respondentes correlacionados (Lam et al.). Alternativa determinística: ler **probabilidades de token** em vez de amostrar (Bradshaw et al., [arxiv.org/abs/2411.03486](https://arxiv.org/abs/2411.03486)) — aplicável a MTS com alternativa fechada, não a projetivos abertos.

**2.3 Versão/release year como variável.** O Mask in the Inkblot trata `lab` (desenvolvedor) e `release year` como estratos e **nunca os controla simultaneamente** (colinearidade), rodando LOO por desenvolvedor, modelo e estímulo. Dzega et al. analisam tamanho/novidade como preditor. O drift de comportamento sem mudança de rótulo (Chen et al. 2023, [arxiv.org/abs/2307.09009](https://arxiv.org/abs/2307.09009)) torna o `modelRef` + data da coleta obrigatórios — não "GPT-4o", mas rota+snapshot.

**2.4 Amarras estatísticas.** (i) Framing de superpopulação e IC (Miller); (ii) modelos multinível (respostas aninhadas em modelo, aninhado em desenvolvedor/família — implícito no desenho LOO do Mask e explícito nas auditorias de heterogeneidade); (iii) **flexibilidade analítica**: Cummins ([arxiv.org/abs/2509.13397](https://arxiv.org/abs/2509.13397)) mostra que escolhas defensáveis (modelo, prompt, forma demográfica) movem a correspondência humano-silício de r=0,23 a 0,84 em 252+66 configurações — logo, pré-registro e grade de especificações; (iv) correção para múltiplas comparações quando múltiplos traços/estímulos (o Mask reporta *ranges* LOO em vez de um único p); (v) validade de inferência com dados sintéticos por exchangeability (Tan & Zrnic); (vi) TS2E (Sen et al.) como enumerador de ameaças de validade em todo o ciclo de vida.

---

## 3. Validade: críticas centrais e mitigações

**3.1 Contaminação de treino.** A crítica mais dura e melhor documentada: itens de testes públicos estão na internet, portanto no corpus. Han et al. ([arxiv.org/abs/2510.07175](https://arxiv.org/abs/2510.07175)) quantificam para BFI-44/PVQ-40: memorização de itens e capacidade de mirar pontuação-alvo. Sühr et al. generalizam: qualquer teste humano aplicado a LLM sem revalidação é inválido. **Mitigações verificadas**: estímulos recém-gerados (GenPT — reformula TAT/Rorschach/SCT com estímulos novos justamente por isso; o Mask gera manchas ASCII próprias), avaliação dinâmica/procedural (DyVal2, [arxiv.org/abs/2402.14865](https://arxiv.org/abs/2402.14865); BenchBench, [arxiv.org/abs/2603.20807](https://arxiv.org/abs/2603.20807)), e IRT/CAT para dosar itens (Zheng et al., [arxiv.org/abs/2603.23506](https://arxiv.org/abs/2603.23506) — 1,3% do banco correlaciona ~perfeitamente com o banco inteiro). **A vantagem estrutural do F5**: o motor MTS gera tentativas proceduralmente com seed — cada participante-LLM pode receber um conjunto inédito, content-addressed, estatisticamente equado; é a mitigaçăo de contaminação em estado puro. Imagens sintéticas: o Mask (ASCII) e GenPT (estímulos novos) provam o conceito; para LMMs, manchas/figuras geradas proceduralmente com parâmetros registrados evitam tanto contaminação quanto questões de direito autoral das pranchas clássicas.

**3.2 Superficialidade de persona / homogeneização.** "Das Man" (Li et al., [arxiv.org/abs/2507.02919](https://arxiv.org/abs/2507.02919)): homogeneização severa de opiniões minoritárias, explicada por otimização da resposta modal. "Silicon Philosophers" (Shi & Haupt, [arxiv.org/abs/2604.23575](https://arxiv.org/abs/2604.23575)): consenso artificial via sobre-correlação de julgamentos. Qin et al. ([arxiv.org/abs/2604.06663](https://arxiv.org/abs/2604.06663)): nenhuma configuração de segmentação de audiência domina todas as dimensões de fidelidade. Bisbee et al. ([doi.org/10.1017/pan.2024.5](https://doi.org/10.1017/pan.2024.5)) e Dillion et al. ([doi.org/10.1016/j.tics.2023.04.005](https://doi.org/10.1016/j.tics.2023.04.005)) selam o consenso de que substituição de participantes humanos não é defensável. Kuric et al. ([arxiv.org/abs/2605.18311](https://arxiv.org/abs/2605.18311)) mostram discrepância sistemática mesmo em preferências "objetivas" de design (n=2.073, 29 testes). Implicação para o F5: o alvo válido não é "simular humanos", é **caracterizar o modelo** — a unidade de análise é o modelo (ou família), não a persona.

**3.3 Não-comparabilidade com normas humanas.** Almeida et al. ([arxiv.org/abs/2308.01264](https://arxiv.org/abs/2308.01264)), replicando 8 estudos: LLMs mostram redução de variância e efeitos exagerados — não caem na faixa de variação humana, então converter escores brutos em normas (percentis Rorschach, normas TAT) é categoria errada. O Mask contorna com baseline interno (taxa de "mask" da amostra de modelos "neither"). Conclusão operacional: usar **baseline amostral da população de modelos** + LOO, jamais normas clínicas humanas.

**3.4 Agregação e o problema tipo-Simpson.** A referência "(ACM)" não foi localizada; o conteúdo, porém, está estabelecido por três resultados 2026: (i) **alinhamento marginal ≠ fidelidade conjunta** (Bae, [arxiv.org/abs/2606.12433](https://arxiv.org/abs/2606.12433)) — casar marginais demográficos não garante a distribuição conjunta, que é o que importa; (ii) agregação entre modelos/personas colapsa heterogeneidade (Das Man; Silicon Philosophers); (iii) o driver das respostas pode ser o rótulo de grupo (país), não indivíduo (Wang). Genericamente: qualquer estatística agregada do F5 deve ser acompanhada de decomposição por desenvolvedor/modelo/estímulo (o desenho LOO do Mask é a resposta padrão).

**3.5 Viés de desejabilidade e direcionalidade.** GenPT documenta shifts direcionais sob framing de desejabilidade em questionários (mais forte em ideação suicida) e comportamento quase simétrico do projetivo; Chapala et al. ([arxiv.org/abs/2512.22725](https://arxiv.org/abs/2512.22725)) mostram que prompts reformulados em 3ª pessoa neutra ajudam, priming/preambule não. Zhao et al. (stereotype hallucination) alertam que o conteúdo "projetivo" do LLM pode refletir estereótipos de segunda ordem do corpus, não processo psicológico análogo.

---

## 4. Métricas: o que medir como "desempenho"

**4.1 Tarefas procedurais com acerto objetivo (MTS).**
- **Primárias**: acurácia por condição estrutural (tipo de relação, dificuldade paramétrica da tentativa gerada), curva de aprendizado dentro da sessão (tentativas sequenciais), latência de resposta, consistência (test-retest com tentativas equadas por seed).
- **Psicométricas**: calibrar tentativas por IRT (dificuldade/discriminação) e estimar traço do modelo-participante por CAT (Zheng et al. — economia de 98,7% de itens); DIF por família/desenvolvedor como análogo de "viés cultural".
- **Estatísticas**: efeito com IC via framing de superpopulação (Miller); LOO por modelo/desenvolvedor; grade de especificações para robustez (Cummins).
- **Vantagem MTS**: acerto objetivo elimina juiz-LLM do loop de mensuração — o juiz só entra em análise secundária de justificativas, se houver.

**4.2 Projetivos com resposta aberta.** Sem acerto objetivo, a cadeia de mensuração é a questão central. Estado da prática:
- **Léxico**: Mask usa léxico de 83 palavras de percept + termos-gatilho, com ranking de todo o vocabulário como sanidade.
- **Embeddings**: Heath & Alexander usam similaridade semântica para recuperar variância perdida em escala numérica; embeddings são também a via para comparar distribuição de respostas entre modelos sem juiz.
- **Juiz-LLM com validação humana**: padrão emergente — Dzega et al. mostram avaliadores-LLM "altamente consistentes com especialistas humanos" em SCORS-G; Pimentel & Meyer (Assessment, [doi.org/10.1177/10731911261455137](https://doi.org/10.1177/10731911261455137)) propõem framework de validação para codificadores-LLM no Rorschach (MOR). A literatura de anotação é unânime na exigência: validação contra códigos humanos em subamostra (Pangakis et al., [arxiv.org/abs/2306.00176](https://arxiv.org/abs/2306.00176)); confiabilidade pode cair abaixo de limiar científico com pequenas variações de prompt (Reiss, [arxiv.org/abs/2304.11085](https://arxiv.org/abs/2304.11085)); variabilidade ampla por tarefa/prompt (Kristensen-McLachlan et al., PNAS Nexus, [arxiv.org/abs/2311.05769](https://arxiv.org/abs/2311.05769)).
- **Distribuição vs normas**: relatar distribuição completa de códigos por modelo contra baseline de modelos (não normas humanas), com decomposição por estímulo (efeitos de estímulo são grandes no Mask — LOO por estímulo).
- **Redução de dimensionalidade**: SCORS-G (8 dimensões) do paper TAT é um template de rubrica multidimensional pronta para adaptar.

---

## 5. Ética e padrões de relato

O que a comunidade passou a exigir para replicação (síntese de Mask, Miller, TS2E, Cummins, GenPT):

1. **Proveniência completa do modelo**: `modelRef` canônico + provedor + rota/endpoint + snapshot ou data da coleta (drift é documentado desde Chen et al. 2023).
2. **Parâmetros de geração**: temperatura, top-p, seed, N réplicas por condição, ordem de apresentação.
3. **Estímulos content-addressed**: MANIFEST com hash por estímulo (SHA1 no Mask) + parâmetros do gerador procedural e seed do RNG — prova byte-a-byte do que foi enviado ao modelo.
4. **Custo por run** e latência: parte do registro experimental (o TrialResult da plataforma já captura; a literatura de evals cobrou isso via Miller; TS2E exige documentação de todo o pipeline).
5. **Retenção de texto de resposta**: o Mask retém o bruto e publica só derivados — política explícita (publicar texto pode violar ToS de provedor ou facilitar contaminação futura; guardar tudo internamente é requisito de auditoria). Decisão consciente e documentada, não omissão.
6. **Congelamento de análise + script de re-execução** que reproduza todas as tabelas (rerun.py do Mask conferiu 97 números), e **pré-registro/grade de especificações** (Cummins).
7. **QC independente**: leituras a cegas (cold reads) de conteúdo por avaliador não-envolvido; auditoria de pipeline.
8. **Honestidade epistêmica**: participantes são modelos, não humanos — cláusula de não-substituição (Dillion; Bisbee); se o desenho toca "stance" do modelo sobre sua própria experiência (estilo Mask/AI-welfare), declarar explicitamente.
9. **Reporte de negativos e ranges LOO**, não só ponto-estimado.

---

## 6. Implicações práticas para o desenho do F5

Recomendações conectadas ao que a plataforma já tem (TrialResult com modelRef/provider/rota/custo/latency; seed de RNG; estímulos content-addressed; experimentos como schema JSON executável por LLM; motor MTS gerando tentativas; projetivos priorizados):

1. **Participante = modelo, unidade de análise = família/desenvolvedor.** Condicionamento de persona como fator experimental opcional (nível 2), nunca como "amostra". Estratificar por desenvolvedor e release year como o Mask; nunca co-controlá-los; sempre LOO.
2. **Congela o estímulo, não o texto.** Toda tentativa MTS e toda prancha projetiva entra com `sha1` + parâmetros do gerador + seed no TrialResult. O documento-experimento JSON já é o protocolo; versioná-lo com hash também (o experimento é um estímulo).
3. **Anti-contaminação por desenho**: MTS procedural com parâmetros sorteados por seed a cada run — nenhum modelo vê a mesma tentativa duas vezes entre participantes (e registre a colisão se reutilizar). Para projetivos, estímulos gerados proceduralmente (padrão GenPT/Mask), não pranchas clássicas escaneadas.
4. **Réplicas**: N≥10 extrações por modelo por condição com temperatura fixa e registrada; reportar IC (Miller); para MTS fechado, adicionar leitura determinística por probabilidade de token como condição paralela (Bradshaw).
5. **Baseline interno em vez de normas humanas**: condição "neither" (Mask) e baseline da população de modelos; nunca converter em percentis clínicos.
6. **Métricas MTS**: acurácia por dificuldade estrutural, curva de aprendizado, latência (já no TrialResult), consistência test-retest com equação por seed; calibração IRT das tentativas como evolução.
7. **Métricas projetivas**: pipeline em três camadas — (a) léxico fechado versionado; (b) embeddings para distribuição entre modelos; (c) juiz-LLM com rubrica multidimensional (SCORS-G como template) **validado contra códigos humanos em subamostra ≥10% com κ relatado** (padrão Pangakis/Pimentel).
8. **Congelamento e re-execução**: análise deriva 100% do CSV de TrialResults; script `rerun` que reproduz tabela-a-tabela; pré-registro da hipótese e grade de especificações antes da coleta larga.
9. **QC**: cold read cego de ~5% das respostas por avaliador independente (humano ou modelo de outra família, com a ressalva de Reiss sobre confiabilidade); checagem de colapso de modo (distribuição de respostas únicas por modelo — Jang/Heath).
10. **Relato**: cada run público traz modelRef+rota+data+temperatura+seed+custo+latência; texto bruto retido no repositório interno, derivados publicados; nota de que participantes são modelos (não-substituição de amostra humana).
11. **Execução pelo próprio documento**: como o experimento é schema JSON, o F5 pode ser executado por um agente-LLM lendo o mesmo documento que o runtime humano — registrar qual runtime executou (campo `executedBy`) para não misturar populações de executor.
12. **Próximos passos de literatura**: monitorar GenPT (mais próximo concorrente/antecessor), TS2E (checklist de validade), Han et al. (métricas de contaminação para aplicar ao nosso banco e demonstrar a vantagem procedural).

---

## Checklist F5

**Desenho**
- [ ] Fatores: persona (com/sem/neither), família de modelo, release year, estímulo — nunca co-controlar desenvolvedor+release year
- [ ] Leave-one-out planejado por desenvolvedor, modelo e estímulo; reportar ranges, não só ponto-estimado
- [ ] Temperatura/top-p fixos e registrados; N réplicas por condição definido a priori; IC em toda comparação
- [ ] Pré-registro + grade de especificações (lição Cummins: r varia 0,23–0,84 por escolhas defensáveis)
- [ ] Condição determinística por probabilidade de token para MTS fechado (paralela à amostrada)

**Estímulos**
- [ ] Todo estímulo com sha1 + parâmetros do gerador + seed do RNG no TrialResult
- [ ] MTS: tentativas únicas por run (sorteadas por seed); logar taxa de reuso
- [ ] Projetivos: estímulos procedurais próprios (ASCII/sintético), nunca pranchas clássicas
- [ ] MANIFEST.json por experimento, com hash do próprio documento-experimento

**Coleta**
- [ ] modelRef canônico + provider + rota + snapshot/data + custo + latência em cada TrialResult
- [ ] Texto bruto retido internamente; publicação só de derivados (política documentada)
- [ ] Campo `executedBy` (runtime humano vs agente-LLM)

**Mensuração**
- [ ] MTS: acurácia por dificuldade estrutural, curva de aprendizado, latência, test-retest equado por seed
- [ ] Projetivos: léxico versionado + embeddings + juiz-LLM com rubrica multidimensional (SCORS-G adaptada)
- [ ] Validação humana: subamostra ≥10% com kappa; cold reads cegos independentes
- [ ] Checagem de colapso de modo (n de respostas únicas por modelo) antes de agregar
- [ ] Baseline = população de modelos (condição "neither"); zero uso de normas clínicas humanas

**Análise e relato**
- [ ] Script `rerun` que regenera todas as tabelas do CSV de TrialResults; conferência número-a-número
- [ ] Congelamento de análise antes da publicação; negativos reportados
- [ ] TS2E aplicado como checklist de validade na redação final
- [ ] Frase-padrão de não-substituição de participantes humanos (Dillion/Bisbee)
- [ ] Teste de contaminação estilo Han et al. no nosso banco, como evidência da vantagem procedural

---

**Principais fontes** (todas acessadas/verificadas em 03/10/2026): [github.com/sdeture/mask-in-the-inkblot](https://github.com/sdeture/mask-in-the-inkblot) · [arxiv.org/abs/2602.17108](https://arxiv.org/abs/2602.17108) (TAT/LMM) · [arxiv.org/abs/2606.00860](https://arxiv.org/abs/2606.00860) (GenPT) · [arxiv.org/abs/2606.30945](https://arxiv.org/abs/2606.30945) · [arxiv.org/abs/2604.18437](https://arxiv.org/abs/2604.18437) · [doi.org/10.1177/10731911261455137](https://doi.org/10.1177/10731911261455137) · [arxiv.org/abs/2510.07175](https://arxiv.org/abs/2510.07175) · [arxiv.org/abs/2507.23009](https://arxiv.org/abs/2507.23009) · [doi.org/10.1017/pan.2023.2](https://doi.org/10.1017/pan.2023.2) · [arxiv.org/abs/2402.18144](https://arxiv.org/abs/2402.18144) · [arxiv.org/abs/2608.14079](https://arxiv.org/abs/2608.14079) · [doi.org/10.1017/pan.2024.5](https://doi.org/10.1017/pan.2024.5) · [doi.org/10.1016/j.tics.2023.04.005](https://doi.org/10.1016/j.tics.2023.04.005) · [arxiv.org/abs/2301.07543](https://arxiv.org/abs/2301.07543) · [arxiv.org/abs/2609.10280](https://arxiv.org/abs/2609.10280) · [arxiv.org/abs/2509.13397](https://arxiv.org/abs/2509.13397) · [arxiv.org/abs/2609.16395](https://arxiv.org/abs/2609.16395) · [arxiv.org/abs/2607.28550](https://arxiv.org/abs/2607.28550) · [arxiv.org/abs/2607.25292](https://arxiv.org/abs/2607.25292) · [arxiv.org/abs/2606.12433](https://arxiv.org/abs/2606.12433) · [arxiv.org/abs/2507.02919](https://arxiv.org/abs/2507.02919) · [arxiv.org/abs/2604.23575](https://arxiv.org/abs/2604.23575) · [arxiv.org/abs/2606.30085](https://arxiv.org/abs/2606.30085) · [arxiv.org/abs/2605.18311](https://arxiv.org/abs/2605.18311) · [arxiv.org/abs/2412.13169](https://arxiv.org/abs/2412.13169) · [arxiv.org/abs/2509.09871](https://arxiv.org/abs/2509.09871) · [arxiv.org/abs/2512.22725](https://arxiv.org/abs/2512.22725) · [arxiv.org/abs/2303.13988](https://arxiv.org/abs/2303.13988) · [doi.org/10.1073/pnas.2218523120](https://doi.org/10.1073/pnas.2218523120) · [doi.org/10.1073/pnas.2312911120](https://doi.org/10.1073/pnas.2312911120) · [arxiv.org/abs/2308.01264](https://arxiv.org/abs/2308.01264) · [arxiv.org/abs/2305.07970](https://arxiv.org/abs/2305.07970) · [arxiv.org/abs/2307.16513](https://arxiv.org/abs/2307.16513) · [arxiv.org/abs/2507.12296](https://arxiv.org/abs/2507.12296) · [arxiv.org/abs/2506.18156](https://arxiv.org/abs/2506.18156) · [arxiv.org/abs/2608.04646](https://arxiv.org/abs/2608.04646) · [arxiv.org/abs/2411.10473](https://arxiv.org/abs/2411.10473) · [arxiv.org/abs/2503.00611](https://arxiv.org/abs/2503.00611) · [arxiv.org/abs/2405.19498](https://arxiv.org/abs/2405.19498) · [arxiv.org/abs/2411.00640](https://arxiv.org/abs/2411.00640) · [arxiv.org/abs/2606.13629](https://arxiv.org/abs/2606.13629) · [arxiv.org/abs/2411.03486](https://arxiv.org/abs/2411.03486) · [arxiv.org/abs/2303.18248](https://arxiv.org/abs/2303.18248) · [arxiv.org/abs/2311.10017](https://arxiv.org/abs/2311.10017) · [arxiv.org/abs/2307.09009](https://arxiv.org/abs/2307.09009) · [arxiv.org/abs/2306.00176](https://arxiv.org/abs/2306.00176) · [arxiv.org/abs/2304.11085](https://arxiv.org/abs/2304.11085) · [arxiv.org/abs/2311.05769](https://arxiv.org/abs/2311.05769) · [arxiv.org/abs/2503.01903](https://arxiv.org/abs/2503.01903) · [arxiv.org/abs/2504.18260](https://arxiv.org/abs/2504.18260) · [arxiv.org/abs/2310.20256](https://arxiv.org/abs/2310.20256) · [arxiv.org/abs/2603.23506](https://arxiv.org/abs/2603.23506) · [arxiv.org/abs/2402.14865](https://arxiv.org/abs/2402.14865) · [arxiv.org/abs/2603.20807](https://arxiv.org/abs/2603.20807) · [arxiv.org/abs/2604.22215](https://arxiv.org/abs/2604.22215) · [arxiv.org/abs/2604.06663](https://arxiv.org/abs/2604.06663) · [arxiv.org/abs/2609.15849](https://arxiv.org/abs/2609.15849) · [arxiv.org/abs/2607.03091](https://arxiv.org/abs/2607.03091)