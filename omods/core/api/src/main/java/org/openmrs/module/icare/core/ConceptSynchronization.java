package org.openmrs.module.icare.core;

import org.openmrs.BaseOpenmrsData;
import org.openmrs.BaseOpenmrsMetadata;
import org.openmrs.OpenmrsMetadata;

import javax.persistence.*;

@Entity
@Table(name = "icare_concept_synchronization")
public class ConceptSynchronization extends BaseOpenmrsMetadata {
    @Id
    @GeneratedValue
    @Column(name = "concept_synchronization_id", unique = true)
    private Integer id;
    @Column(name="metadata_uuid")
    private String metadata;
    @Column(name="metadata_type")
    private String metadataType; // concept/referenceterm/conceptsource/
    @Column(name="synchronised")
    private  Boolean synchronised;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getMetadata() {
        return metadata;
    }
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
    public String getMetadataType() {
        return metadataType;
    }
    public void setMetadataType(String metadataType) {
        this.metadataType =metadataType;
    }

    public void setSynchronised(Boolean synchronised) {
        this.synchronised = synchronised;
    }

    public Boolean getSynchronised() {
        return synchronised;
    }
}
