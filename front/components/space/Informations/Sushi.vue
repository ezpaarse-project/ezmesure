<template>
  <v-card flat>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-combobox
            v-model="platformSelected"
            :items="platforms"
            label="Plateformes"
            item-text="name"
            outlined
            @change="addPlatform()"
          />
        </v-col>

        <v-expansion-panels accordion>
          <v-expansion-panel
            v-for="(platform, key) in platformsAdded"
            :ref="key"
            :key="key"
          >
            <v-expansion-panel-header>
              {{ platform.name }}
              <template v-slot:actions>
                <v-icon>mdi-menu-down</v-icon>
              </template>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-row>
                <v-col cols="4">
                  <v-text-field
                    v-model="platform.requestorId"
                    label="Requestor Id *"
                    outlined
                    required
                  />
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model="platform.customerId"
                    label="Customer Id *"
                    outlined
                  />
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model="platform.apiKey"
                    label="Clé API"
                    outlined
                  />
                </v-col>
              </v-row>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <span class="caption">* champs obligatoires</span>
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!platformsAdded.length"
        @click="save"
      >
        Sauvegarder
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  // eslint-disable-next-line vue/require-prop-types
  props: ['establishment'],
  data() {
    return {
      platformSelected: null,
      platformsAdded: [],
      platforms: [
        { url: 'https://www.projectcounter.org/counter-user/acs-publicatio/', name: 'ACS Publications' },
        { url: 'https://www.projectcounter.org/counter-user/adam-matthew-d/', name: 'Adam Matthew Digital' },
        { url: 'https://www.projectcounter.org/counter-user/american-mathe/', name: 'American Mathematical Society' },
        { url: 'https://www.projectcounter.org/counter-user/remco-de-boer/', name: 'Atlantis Press' },
        { url: 'https://www.projectcounter.org/counter-user/atypon/', name: 'Atypon Systems' },
        { url: 'https://www.projectcounter.org/counter-user/begell-house-p/', name: 'Begell House Publishing' },
        { url: 'https://www.projectcounter.org/counter-user/bentham-science/', name: 'Bentham Science' },
        { url: 'https://www.projectcounter.org/counter-user/tao-mantaras/', name: 'BibliU' },
        { url: 'https://www.projectcounter.org/counter-user/bloomsbury-publishing-plc/', name: 'Bloomsbury Publishing Plc' },
        { url: 'https://www.projectcounter.org/counter-user/stuart-kacy/', name: 'Cabell\'s International' },
        { url: 'https://www.projectcounter.org/counter-user/cairn/', name: 'Cairn' },
        { url: 'https://www.projectcounter.org/counter-user/cambridge-univ/', name: 'Cambridge University Press' },
        { url: 'https://www.projectcounter.org/counter-user/thomson-reuter/', name: 'Clarivate Analytics' },
        { url: 'https://www.projectcounter.org/counter-user/credo-referenc/', name: 'Credo Reference' },
        { url: 'https://www.projectcounter.org/counter-user/ebook-central/', name: 'Ebook Central (Proquest)' },
        { url: 'https://www.projectcounter.org/counter-user/ebsco/', name: 'EBSCO Information Services' },
        { url: 'https://www.projectcounter.org/counter-user/elsevier-scien/', name: 'Elsevier ScienceDirect' },
        { url: 'https://www.projectcounter.org/counter-user/elsevier-scopu/', name: 'Elsevier SCOPUS' },
        { url: 'https://www.projectcounter.org/counter-user/engineering-vi/', name: 'Engineering Village' },
        { url: 'https://www.projectcounter.org/counter-user/faculty-of-100/', name: 'Faculty of 1000' },
        { url: 'https://www.projectcounter.org/counter-user/gale-cengage/', name: 'Gale Cengage' },
        { url: 'https://www.projectcounter.org/counter-user/igi-global/', name: 'IGI Global' },
        { url: 'https://www.projectcounter.org/counter-user/informit/', name: 'Informit' },
        { url: 'https://www.projectcounter.org/counter-user/publishing-tec/', name: 'Ingenta' },
        { url: 'https://www.projectcounter.org/counter-user/international/', name: 'International Association for Energy Economics' },
        { url: 'https://www.projectcounter.org/counter-user/john-hopkins-u/', name: 'John Hopkins University/Project MUSE' },
        { url: 'https://www.projectcounter.org/counter-user/jstage-japan-s/', name: 'JSTAGE Japan Science &amp; Technology Agency' },
        { url: 'https://www.projectcounter.org/counter-user/jstor/', name: 'JSTOR' },
        { url: 'https://www.projectcounter.org/counter-user/scott-gibberns/', name: 'Kortext Limited' },
        { url: 'https://www.projectcounter.org/counter-user/liblynx-connect/', name: 'LibLynx' },
        { url: 'https://www.projectcounter.org/counter-user/mps-technologi/', name: 'MPS Technologies' },
        { url: 'https://www.projectcounter.org/counter-user/newsbank-inc/', name: 'NewsBank Inc' },
        { url: 'https://www.projectcounter.org/counter-user/ovid-technolog/', name: 'Ovid Technologies' },
        { url: 'https://www.projectcounter.org/counter-user/proquest-ebook/', name: 'ProQuest' },
        { url: 'https://www.projectcounter.org/counter-user/karger/', name: 'S. Karger AG' },
        { url: 'https://www.projectcounter.org/counter-user/global-village/', name: 'SAGE Publications – SecureCenter (previously GVPi)' },
        { url: 'https://www.projectcounter.org/counter-user/scholarly-iq/', name: 'Scholarly iQ' },
        { url: 'https://www.projectcounter.org/counter-user/safari-books-online-pubfactory-platform/', name: 'Sheridan PubFactory' },
        { url: 'https://www.projectcounter.org/counter-user/silverchair-in/', name: 'Silverchair Information Systems' },
        { url: 'https://www.projectcounter.org/counter-user/nature-publish/', name: 'Springer Nature' },
        { url: 'https://www.projectcounter.org/counter-user/karen-coles/', name: 'VitalSource Limited' },
        { url: 'https://www.projectcounter.org/counter-user/wolters-kluwer/', name: 'Wolters Kluwer Espana (LamyLine)' },
        { url: 'https://www.projectcounter.org/counter-user/acm/', name: 'ACM' },
        { url: 'https://www.projectcounter.org/counter-user/aip-publishing-american-institute-of-physics/', name: 'AIP Publishing American Institute of Physics' },
        { url: 'https://www.projectcounter.org/counter-user/apa-psycnet/', name: 'APA PsycNET' },
        { url: 'https://www.projectcounter.org/counter-user/astm-international/', name: 'ASTM International' },
        { url: 'https://www.projectcounter.org/counter-user/alexander-street-press/', name: 'Alexander Street Press' },
        { url: 'https://www.projectcounter.org/counter-user/american-association-of-neurological-surgeons/', name: 'American Association of Neurological Surgeons' },
        { url: 'https://www.projectcounter.org/counter-user/american-assoc/', name: 'American Associaton for the Advancement of Science AAAS' },
        { url: 'https://www.projectcounter.org/counter-user/american-physi/', name: 'American Physical Society (APS)' },
        { url: 'https://www.projectcounter.org/counter-user/american-psych/', name: 'American Psychological Association' },
        { url: 'https://www.projectcounter.org/counter-user/american-society-for-tropical-medicine-and-hygiene/', name: 'American Society for Tropical Medicine and Hygiene' },
        { url: 'https://www.projectcounter.org/counter-user/american-socie2/', name: 'American Society of Agronomy (ASA)' },
        { url: 'https://www.projectcounter.org/counter-user/american-society-of-microbiology/', name: 'American Society of Microbiology' },
        { url: 'https://www.projectcounter.org/counter-user/annual-reviews/', name: 'Annual Reviews' },
        { url: 'https://www.projectcounter.org/counter-user/association-fo/', name: 'Association for Computing Machinery [ACM]' },
        { url: 'https://www.projectcounter.org/counter-user/bmj-publishing/', name: 'BMJ Publishing Group' },
        { url: 'https://www.projectcounter.org/counter-user/bsava/', name: 'BSAVA (British Small Animal Veterinary Association) Library Ingenta Connect' },
        { url: 'https://www.projectcounter.org/counter-user/bioone/', name: 'BioOne' },
        { url: 'https://www.projectcounter.org/counter-user/brill/', name: 'Brill Books and Journals Online' },
        { url: 'https://www.projectcounter.org/counter-user/bob-gibson/', name: 'Canadian Electronic Library/deslibris' },
        { url: 'https://www.projectcounter.org/counter-user/commonwealth-s/', name: 'Commonwealth Scientific and Industrial Research Organisation (CSIRO)' },
        { url: 'https://www.projectcounter.org/counter-user/computing-revi/', name: 'Computing Reviews' },
        { url: 'https://www.projectcounter.org/counter-user/dram/', name: 'DRAM (dramonline.org)' },
        { url: 'https://www.projectcounter.org/counter-user/dawson-books-limited/', name: 'Dawsonera' },
        { url: 'https://www.projectcounter.org/counter-user/de-gruyter-onl/', name: 'De Gruyter Online' },
        { url: 'https://www.projectcounter.org/counter-user/dare-dictionary/', name: 'Dictionary of American Regional English' },
        { url: 'https://www.projectcounter.org/counter-user/ebsco-ebooks-e/', name: 'EBSCOhost (eBooks and databases)' },
        { url: 'https://www.projectcounter.org/counter-user/edp-sciences/', name: 'EDP Sciences' },
        { url: 'https://www.projectcounter.org/counter-user/eage/', name: 'Eage European Association of Geoscientists and Engineers (EAGE)' },
        { url: 'https://www.projectcounter.org/counter-user/edward-elgar-p/', name: 'Edward Elgar Publishing' },
        { url: 'https://www.projectcounter.org/counter-user/emerald-group/', name: 'Emerald Group Publishing' },
        { url: 'https://www.projectcounter.org/counter-user/harvard-university-press/', name: 'Harvard University Press' },
        { url: 'https://www.projectcounter.org/counter-user/human-kinetics/', name: 'Human Kinetics' },
        { url: 'https://www.projectcounter.org/counter-user/ieee-computer/', name: 'IEEE Computer Society' },
        { url: 'https://www.projectcounter.org/counter-user/ieee-inc-insti/', name: 'IEEE Inc [Institute of Electrical and Electronics Engineers]' },
        { url: 'https://www.projectcounter.org/counter-user/iet/', name: 'IET Digital Library' },
        { url: 'https://www.projectcounter.org/counter-user/iop-publishing/', name: 'IOP Publishing' },
        { url: 'https://www.projectcounter.org/counter-user/indian-journal/', name: 'Indian Journals.com [Divan Enterprises] New Delhi' },
        { url: 'https://www.projectcounter.org/counter-user/infobase/', name: 'Infobase' },
        { url: 'https://www.projectcounter.org/counter-user/irish-newspape/', name: 'Irish Newspaper Archives (INA)' },
        { url: 'https://www.projectcounter.org/counter-user/john-benjamins/', name: 'John Benjamins e-Platform' },
        { url: 'https://www.projectcounter.org/counter-user/journal-of-neurosurgery/', name: 'Journal of Neurosurgery' },
        { url: 'https://www.projectcounter.org/counter-user/loeb-classics/', name: 'LOEB Classics' },
        { url: 'https://www.projectcounter.org/counter-user/mit/', name: 'MIT Press' },
        { url: 'https://www.projectcounter.org/counter-user/mms/', name: 'Massachusetts Medical Society' },
        { url: 'https://www.projectcounter.org/counter-user/tasha-mellinsc/', name: 'Microbiology Society' },
        { url: 'https://www.projectcounter.org/counter-user/new-england-jo/', name: 'New England Journal of Medicine' },
        { url: 'https://www.projectcounter.org/counter-user/np/', name: 'Numerique Premium' },
        { url: 'https://www.projectcounter.org/counter-user/oecd/', name: 'OECD' },
        { url: 'https://www.projectcounter.org/counter-user/optical-societ/', name: 'Optical Society of America (OSA)' },
        { url: 'https://www.projectcounter.org/counter-user/oxford-univers/', name: 'Oxford University Press' },
        { url: 'https://www.projectcounter.org/counter-user/philosophy-documentation-center/', name: 'Philosophy Documentation Center' },
        { url: 'https://www.projectcounter.org/counter-user/physicians-postgraduate-press/', name: 'Physicians Postgraduate Press' },
        { url: 'https://www.projectcounter.org/counter-user/pieronline/', name: 'PierOnline' },
        { url: 'https://www.projectcounter.org/counter-user/portland-press/', name: 'Portland Press' },
        { url: 'https://www.projectcounter.org/counter-user/proquest-llc/', name: 'ProQuest' },
        { url: 'https://www.projectcounter.org/counter-user/rockefeller-un/', name: 'Rockefeller University Press' },
        { url: 'https://www.projectcounter.org/counter-user/rsc/', name: 'Royal Society of Chemistry' },
        { url: 'https://www.projectcounter.org/counter-user/sage-publicati/', name: 'SAGE Publications – Journals' },
        { url: 'https://www.projectcounter.org/counter-user/society-of-photographic-instrumentation-engineers/', name: 'SPIE (Society of Photo-Optical Instrumentation Engineers)' },
        { url: 'https://www.projectcounter.org/counter-user/sabinet/', name: 'Sabinet' },
        { url: 'https://www.projectcounter.org/counter-user/taylor-francis/', name: 'Taylor &amp; Francis Online' },
        { url: 'https://www.projectcounter.org/counter-user/thieme-ebooks/', name: 'Thieme Medical Publishers' },
        { url: 'https://www.projectcounter.org/counter-user/university-of2/', name: 'University of Chicago Press' },
        { url: 'https://www.projectcounter.org/counter-user/john-wiley-son/', name: 'Wiley' },
        { url: 'https://www.projectcounter.org/counter-user/accessible-arc/', name: 'Wolters Kluwer Espana (LamyLine)' },
        { url: 'https://www.projectcounter.org/counter-user/world-scientific-publishing/', name: 'World Scientific Publishing' },
      ],
    };
  },
  methods: {
    save() {
      this.$emit('save');
    },
    addPlatform() {
      this.platformSelected.requestorId = '';
      this.platformSelected.customerId = '';
      this.platformSelected.apiKey = '';

      this.platformsAdded.push(this.platformSelected);
    },
  },
};
</script>
