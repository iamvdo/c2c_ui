<template>
    <div class="section-item" v-show="visible">
        <div class="columns is-mobile section-header">
            <div class="column">
                <h2 class="title is-2" :class="{'has-text-danger': hasError}">
                    {{ title }}
                </h2>
                <p><em> {{ subTitle }} </em></p>
            </div>
            <div class="column is-narrow">
                <button class="button is-info" @click="toggleVisibility">{{ expanded_ ? 'Collapse' : 'Expand' }}</button>
            </div>
        </div>
        <div ref="content" class="section-content section-content-hidden">
            <slot />
            <save-document-row @save="$emit('save', arguments[0])" :is-loading="isLoading"/>
        </div>
        <hr>
    </div>
</template>

<script>

    import SaveDocumentRow from './SaveDocumentRow'

    export default {

        components: {
            SaveDocumentRow
        },

        props: {
            title: {
                type: String,
                required: true
            },
            subTitle: {
                type: String,
                default: 'Lorem ipsum'
            },
            expanded: {
                type: Boolean,
                default: false
            },
            isLoading: {
                type: Boolean,
                required: true
            }
        },

        data() {
            return {
                comment: '',
                expanded_: false,
                style: null,
                visible: true,
                hasError: false
            }
        },

        mounted() {
            this.style = document.createElement('style')
            this.style.type = 'text/css'
            document.getElementsByTagName('head')[0].appendChild(this.style)

            for (let child of this.$children) {
                child.$watch('visible', this.checkVisibility)
                child.$watch('hasError', this.checkHasError)
            }

            this.checkVisibility()
            this.checkHasError()

            if (this.expanded) {
                this.toggleVisibility()
            }
        },

        methods: {
            toggleVisibility() {
                const content = this.$refs.content
                const className = `section-content-expanded${this._uid}`

                if (!this.expanded_) {
                    this.style.innerHTML = `.${className} { max-height: ${content.scrollHeight}px!important; }`
                    content.classList.remove('section-content-hidden')
                    content.classList.add(className)
                    setTimeout(() => {
                                   content.classList.remove(className)
                               },
                               301)
                } else {
                    this.style.innerHTML = `.${className} { max-height: ${content.clientHeight}px!important; }`
                    content.classList.add(className)
                    setTimeout(() => {
                                   content.classList.add('section-content-hidden')
                                   content.classList.remove(className)
                               },
                               0)
                }

                this.expanded_ = !this.expanded_
            },

            checkVisibility() {
                this.visible = false

                for (let child of this.$children) {
                    if (child.visible) {
                        this.visible = true
                        return
                    }
                }
            },

            checkHasError() {
                this.hasError = false

                for (let child of this.$children) {
                    if (child.hasError === true) {
                        this.hasError = true
                    }
                }
            }
        }
    }
</script>

<style scoped lang="scss">
    .section-item {
        .section-header{
            .title{
                margin-bottom: 5px;
            }
        }
        .section-content{
            overflow: hidden;
            transition: max-height 0.3s;
        }

        .section-content-hidden{
            max-height: 0;
        }
    }
</style>