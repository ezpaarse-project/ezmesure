<template>
  <v-dialog v-model="show" width="600">
    <v-card>
      <v-card-title class="headline" v-text="sushiForm.vendor" />

      <v-card-text>
        <v-form id="sushiForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-combobox
                  ref="vendorsBox"
                  v-model="sushiForm.vendor"
                  :items="vendors"
                  label="Plateforme *"
                  :rules="[v => !!v || 'Veuillez saisir un libellé.']"
                  item-text="vendor"
                  outlined
                  required
                  autofocus
                  @change="onVendorChange"
                />
              </v-col>

              <template v-if="sushiForm.vendor">
                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.package"
                    label="Package *"
                    :rules="[v => !!v || 'Veuillez saisir un package.']"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.sushiUrl"
                    label="URL Sushi *"
                    :rules="[v => !!v || 'Veuillez saisir une url.']"
                    :disabled="!canEditSushiUrl"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="sushiForm.requestorId"
                    label="Requestor Id *"
                    :rules="[v => !!v || 'Veuillez saisir un Requestor Id.']"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="sushiForm.customerId"
                    label="Customer Id *"
                    :rules="[v => !!v || 'Veuillez saisir un Customer Id.']"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.apiKey"
                    label="Clé API"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="sushiForm.comment"
                    label="Commentaire"
                    outlined
                  />
                </v-col>
              </template>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          Fermer
        </v-btn>

        <v-btn
          type="submit"
          form="sushiForm"
          color="primary"
          text
          :disabled="!valid"
          :loading="saving"
          v-text="editMode ? 'Mettre à jour' : 'Ajouter'"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      saving: false,
      establishmentId: null,
      canEditSushiUrl: false,
      valid: false,

      sushiForm: {
        vendor: '',
        sushiUrl: '',
        requestorId: '',
        customerId: '',
        apiKey: '',
        comment: '',
        id: null,
      },

      platforms: [
        { sushiUrl: 'https://www.projectcounter.org/counter-user/acs-publicatio/', vendor: 'ACS Publications' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/adam-matthew-d/', vendor: 'Adam Matthew Digital' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/american-mathe/', vendor: 'American Mathematical Society' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/remco-de-boer/', vendor: 'Atlantis Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/atypon/', vendor: 'Atypon Systems' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/begell-house-p/', vendor: 'Begell House Publishing' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/bentham-science/', vendor: 'Bentham Science' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/tao-mantaras/', vendor: 'BibliU' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/bloomsbury-publishing-plc/', vendor: 'Bloomsbury Publishing Plc' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/stuart-kacy/', vendor: 'Cabell\'s International' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/cairn/', vendor: 'Cairn' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/cambridge-univ/', vendor: 'Cambridge University Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/thomson-reuter/', vendor: 'Clarivate Analytics' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/credo-referenc/', vendor: 'Credo Reference' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/ebook-central/', vendor: 'Ebook Central (Proquest)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/ebsco/', vendor: 'EBSCO Information Services' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/elsevier-scien/', vendor: 'Elsevier ScienceDirect' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/elsevier-scopu/', vendor: 'Elsevier SCOPUS' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/engineering-vi/', vendor: 'Engineering Village' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/faculty-of-100/', vendor: 'Faculty of 1000' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/gale-cengage/', vendor: 'Gale Cengage' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/igi-global/', vendor: 'IGI Global' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/informit/', vendor: 'Informit' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/publishing-tec/', vendor: 'Ingenta' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/international/', vendor: 'International Association for Energy Economics' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/john-hopkins-u/', vendor: 'John Hopkins University/Project MUSE' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/jstage-japan-s/', vendor: 'JSTAGE Japan Science &amp; Technology Agency' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/jstor/', vendor: 'JSTOR' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/scott-gibberns/', vendor: 'Kortext Limited' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/liblynx-connect/', vendor: 'LibLynx' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/mps-technologi/', vendor: 'MPS Technologies' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/newsbank-inc/', vendor: 'NewsBank Inc' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/ovid-technolog/', vendor: 'Ovid Technologies' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/proquest-ebook/', vendor: 'ProQuest' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/karger/', vendor: 'S. Karger AG' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/global-village/', vendor: 'SAGE Publications – SecureCenter (previously GVPi)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/scholarly-iq/', vendor: 'Scholarly iQ' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/safari-books-online-pubfactory-platform/', vendor: 'Sheridan PubFactory' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/silverchair-in/', vendor: 'Silverchair Information Systems' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/nature-publish/', vendor: 'Springer Nature' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/karen-coles/', vendor: 'VitalSource Limited' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/wolters-kluwer/', vendor: 'Wolters Kluwer Espana (LamyLine)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/acm/', vendor: 'ACM' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/aip-publishing-american-institute-of-physics/', vendor: 'AIP Publishing American Institute of Physics' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/apa-psycnet/', vendor: 'APA PsycNET' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/astm-international/', vendor: 'ASTM International' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/alexander-street-press/', vendor: 'Alexander Street Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/american-association-of-neurological-surgeons/', vendor: 'American Association of Neurological Surgeons' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/american-assoc/', vendor: 'American Associaton for the Advancement of Science AAAS' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/american-physi/', vendor: 'American Physical Society (APS)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/american-psych/', vendor: 'American Psychological Association' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/american-society-for-tropical-medicine-and-hygiene/', vendor: 'American Society for Tropical Medicine and Hygiene' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/american-socie2/', vendor: 'American Society of Agronomy (ASA)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/american-society-of-microbiology/', vendor: 'American Society of Microbiology' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/annual-reviews/', vendor: 'Annual Reviews' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/association-fo/', vendor: 'Association for Computing Machinery [ACM]' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/bmj-publishing/', vendor: 'BMJ Publishing Group' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/bsava/', vendor: 'BSAVA (British Small Animal Veterinary Association) Library Ingenta Connect' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/bioone/', vendor: 'BioOne' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/brill/', vendor: 'Brill Books and Journals Online' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/bob-gibson/', vendor: 'Canadian Electronic Library/deslibris' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/commonwealth-s/', vendor: 'Commonwealth Scientific and Industrial Research Organisation (CSIRO)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/computing-revi/', vendor: 'Computing Reviews' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/dram/', vendor: 'DRAM (dramonline.org)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/dawson-books-limited/', vendor: 'Dawsonera' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/de-gruyter-onl/', vendor: 'De Gruyter Online' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/dare-dictionary/', vendor: 'Dictionary of American Regional English' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/ebsco-ebooks-e/', vendor: 'EBSCOhost (eBooks and databases)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/edp-sciences/', vendor: 'EDP Sciences' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/eage/', vendor: 'Eage European Association of Geoscientists and Engineers (EAGE)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/edward-elgar-p/', vendor: 'Edward Elgar Publishing' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/emerald-group/', vendor: 'Emerald Group Publishing' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/harvard-university-press/', vendor: 'Harvard University Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/human-kinetics/', vendor: 'Human Kinetics' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/ieee-computer/', vendor: 'IEEE Computer Society' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/ieee-inc-insti/', vendor: 'IEEE Inc [Institute of Electrical and Electronics Engineers]' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/iet/', vendor: 'IET Digital Library' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/iop-publishing/', vendor: 'IOP Publishing' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/indian-journal/', vendor: 'Indian Journals.com [Divan Enterprises] New Delhi' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/infobase/', vendor: 'Infobase' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/irish-newspape/', vendor: 'Irish Newspaper Archives (INA)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/john-benjamins/', vendor: 'John Benjamins e-Platform' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/journal-of-neurosurgery/', vendor: 'Journal of Neurosurgery' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/loeb-classics/', vendor: 'LOEB Classics' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/mit/', vendor: 'MIT Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/mms/', vendor: 'Massachusetts Medical Society' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/tasha-mellinsc/', vendor: 'Microbiology Society' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/new-england-jo/', vendor: 'New England Journal of Medicine' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/np/', vendor: 'Numerique Premium' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/oecd/', vendor: 'OECD' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/optical-societ/', vendor: 'Optical Society of America (OSA)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/oxford-univers/', vendor: 'Oxford University Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/philosophy-documentation-center/', vendor: 'Philosophy Documentation Center' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/physicians-postgraduate-press/', vendor: 'Physicians Postgraduate Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/pieronline/', vendor: 'PierOnline' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/portland-press/', vendor: 'Portland Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/proquest-llc/', vendor: 'ProQuest' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/rockefeller-un/', vendor: 'Rockefeller University Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/rsc/', vendor: 'Royal Society of Chemistry' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/sage-publicati/', vendor: 'SAGE Publications – Journals' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/society-of-photographic-instrumentation-engineers/', vendor: 'SPIE (Society of Photo-Optical Instrumentation Engineers)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/sabinet/', vendor: 'Sabinet' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/taylor-francis/', vendor: 'Taylor &amp; Francis Online' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/thieme-ebooks/', vendor: 'Thieme Medical Publishers' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/university-of2/', vendor: 'University of Chicago Press' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/john-wiley-son/', vendor: 'Wiley' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/accessible-arc/', vendor: 'Wolters Kluwer Espana (LamyLine)' },
        { sushiUrl: 'https://www.projectcounter.org/counter-user/world-scientific-publishing/', vendor: 'World Scientific Publishing' },
      ],
    };
  },
  computed: {
    editMode() {
      return !!this.sushiForm.id;
    },
    vendors() {
      return this.platforms.map(p => p.vendor);
    },
  },
  methods: {
    editSushiItem(establishmentId, sushiData = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.establishmentId = establishmentId;
      this.sushiForm.vendor = sushiData.vendor || '';
      this.sushiForm.package = sushiData.package || '';
      this.sushiForm.sushiUrl = sushiData.sushiUrl || '';
      this.sushiForm.requestorId = sushiData.requestorId || '';
      this.sushiForm.customerId = sushiData.customerId || '';
      this.sushiForm.apiKey = sushiData.apiKey || '';
      this.sushiForm.comment = sushiData.comment || '';
      this.sushiForm.id = sushiData.id;
      this.show = true;
    },

    createSushiItem(establishmentId) {
      this.editSushiItem(establishmentId);
    },

    onVendorChange() {
      const vendor = this.sushiForm.vendor?.toLowerCase();
      const platform = this.platforms.find(p => p.vendor.toLowerCase() === vendor);

      this.sushiForm.sushiUrl = platform?.sushiUrl || '';
      this.canEditSushiUrl = !platform?.sushiUrl;

      // workaround to hide vendors list on change
      this.$refs.vendorsBox.isMenuActive = false;
    },

    async save() {
      this.saving = true;

      try {
        if (this.sushiForm.id) {
          await this.$axios.$patch(`/establishments/${this.establishmentId}/sushi`, this.sushiForm);
        } else {
          await this.$axios.$post(`/establishments/${this.establishmentId}/sushi`, this.sushiForm);
          this.show = false;
        }
        this.$emit('update');
      } catch (e) {
        this.$store.dispatch('snacks/error', 'L\'envoi du formulaire a échoué');
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', 'Informations transmises');
      this.saving = false;
      this.show = false;
    },
  },
};
</script>
